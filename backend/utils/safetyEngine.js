/**
 * SportVerse AI - Deterministic Safety & Red-Flag Engine
 * Classifies injury risk as LOW, MODERATE, HIGH, or URGENT.
 * Runs deterministically BEFORE Gemini and CANNOT be downgraded by AI.
 */

function classifyRisk({
  symptoms = [],
  painLevel = 0,
  bodyPart = '',
  injuryMechanism = '',
  hasSwelling = false,
  mobilityStatus = 'Full',
  hasPreviousInjury = false,
  sport = '',
  text = ''
}) {
  const allText = [
    bodyPart,
    injuryMechanism,
    ...(Array.isArray(symptoms) ? symptoms : [symptoms]),
    sport,
    text
  ].join(' ').toLowerCase();

  const detectedRedFlags = [];
  const reasoning = [];

  // 1. URGENT Emergency Triggers (Immediate medical emergency / trauma)
  const urgentKeywords = [
    'unconscious', 'passed out', 'blacked out', 'loss of consciousness',
    "can't breathe", 'cannot breathe', 'difficulty breathing', 'shortness of breath',
    'chest pain', 'heart palpitations',
    'severe deformity', 'gross deformity', 'bone exposed', 'bone protruding',
    'spine injury', 'neck trauma', 'neck pain with numbness',
    'uncontrolled bleeding', 'profuse bleeding',
    'pupils unequal', 'seizure', 'slurred speech'
  ];

  for (const kw of urgentKeywords) {
    if (allText.includes(kw)) {
      detectedRedFlags.push(`Urgent symptom: ${kw}`);
    }
  }

  // Head/Spine injury with severe pain and no mobility
  const isHeadOrSpine = allText.includes('head') || allText.includes('neck') || allText.includes('spine');
  if (isHeadOrSpine && (painLevel >= 8 || mobilityStatus === 'None' || allText.includes('concussion') && allText.includes('vomit'))) {
    detectedRedFlags.push('Head/Neck/Spine trauma with severe symptoms');
  }

  if (detectedRedFlags.length > 0) {
    return {
      riskLevel: 'URGENT',
      responseType: 'URGENT_SAFETY',
      redFlags: detectedRedFlags,
      reasoning: 'Critical red flags detected requiring emergency medical attention.',
      professionalCareRecommended: true,
      urgentGuidance: [
        'SEEK EMERGENCY MEDICAL CARE IMMEDIATELY (Call 112 / 911 or visit the nearest Emergency Room)',
        'Do NOT attempt to move if neck or spinal injury is suspected',
        'Immobilize the injured area and do not apply pressure or attempt to realign bones/joints',
        'Keep the individual calm and monitored until emergency medical responders arrive'
      ]
    };
  }

  // 2. HIGH Risk Triggers (Suspected fractures, complete tears, total loss of function)
  const highKeywords = [
    'fracture', 'broken', 'dislocation', 'dislocated', 'torn ligament', 'acl tear', 'achilles rupture',
    "can't bear weight", 'cannot bear weight', 'unable to walk', 'cannot walk',
    'numbness', 'tingling in fingers', 'tingling in toes', 'loss of sensation',
    'locked joint', 'knee locked', 'joint locked'
  ];

  for (const kw of highKeywords) {
    if (allText.includes(kw)) {
      detectedRedFlags.push(kw);
      reasoning.push(`High risk indicator: ${kw}`);
    }
  }

  if (hasSwelling && painLevel >= 7) {
    detectedRedFlags.push('Severe swelling accompanied by intense pain (7+/10)');
    reasoning.push('Severe swelling with high pain');
  }
  if (mobilityStatus === 'None') {
    detectedRedFlags.push('Complete loss of joint/limb mobility');
    reasoning.push('Complete loss of mobility');
  }
  if (allText.includes('popping sound') || allText.includes('loud pop') || allText.includes('loud snap')) {
    detectedRedFlags.push('Audible pop or snap heard at moment of injury');
    reasoning.push('Popping sound heard');
  }
  if (painLevel >= 8) {
    detectedRedFlags.push('Severe pain level rated 8+/10');
    reasoning.push('Very high pain score');
  }

  if (detectedRedFlags.length > 0) {
    return {
      riskLevel: 'HIGH',
      responseType: 'NORMAL',
      redFlags: detectedRedFlags,
      reasoning: reasoning.join('; ') || 'High risk indicators detected.',
      professionalCareRecommended: true
    };
  }

  // 3. MODERATE Risk Triggers (Manageable swelling, partial mobility loss, mild/moderate pain 4-6)
  if ((painLevel >= 4 && painLevel <= 6) || mobilityStatus === 'Partial' || (hasSwelling && painLevel < 7) || hasPreviousInjury || allText.includes('twist') || allText.includes('sprain') || allText.includes('strain')) {
    if (painLevel >= 4 && painLevel <= 6) reasoning.push('Moderate pain level');
    if (mobilityStatus === 'Partial') reasoning.push('Partial mobility loss');
    if (hasSwelling) reasoning.push('Localized swelling present');
    if (hasPreviousInjury) reasoning.push('History of previous injury in this area');

    return {
      riskLevel: 'MODERATE',
      responseType: 'NORMAL',
      redFlags: [],
      reasoning: reasoning.join('; ') || 'Moderate symptoms with partial mobility.',
      professionalCareRecommended: hasSwelling || painLevel >= 5
    };
  }

  // 4. LOW Risk
  return {
    riskLevel: 'LOW',
    responseType: 'NORMAL',
    redFlags: [],
    reasoning: 'Mild symptoms with full mobility and manageable discomfort.',
    professionalCareRecommended: false
  };
}

module.exports = { classifyRisk };
