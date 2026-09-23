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
  const URGENT_PATTERNS = [
    { pattern: /\b(unconscious|passed\s+out|blacked\s+out|loss\s+of\s+consciousness|lost\s+consciousness)\b/i, label: 'Loss of consciousness' },
    { pattern: /\b(can'?t|cannot|difficulty|trouble|struggling\s+to|shortness\s+of)\s+(breathe?|breathing)\b/i, label: 'Respiratory distress / Breathing difficulty' },
    { pattern: /\b(chest\s+pain|heart\s+palpitations|irregular\s+heartbeat)\b/i, label: 'Chest pain or cardiac symptom' },
    { pattern: /\b(bone\s+(?:is\s+)?(?:protruding|exposed|sticking\s+out)|open\s+fracture|compound\s+fracture)\b/i, label: 'Bone protruding / open fracture' },
    { pattern: /\b(?:severe|gross|visible|obvious)\s+deform(?:ity|ed)\b/i, label: 'Gross or severe deformity' },
    { pattern: /\b(?:spine|spinal|neck)\s+(?:injury|trauma|fracture|broken)\b/i, label: 'Spine / neck trauma' },
    { pattern: /\b(?:uncontrolled|profuse|heavy|severe)\s+bleed(?:ing)?\b|\bbleed(?:ing)?\s+(?:profusely|uncontrollably|heavily)\b/i, label: 'Severe / profuse bleeding' },
    { pattern: /\b(?:pupils?\s+unequal|seizure|slurred\s+speech|convulsion)\b/i, label: 'Neurological emergency symptom' }
  ];

  for (const item of URGENT_PATTERNS) {
    if (item.pattern.test(allText)) {
      detectedRedFlags.push(item.label);
    }
  }

  // Head/Spine injury with severe pain and no mobility
  const isHeadOrSpine = /\b(head|neck|spine)\b/i.test(allText);
  if (isHeadOrSpine && (painLevel >= 8 || mobilityStatus === 'None' || (/\bconcussion\b/i.test(allText) && /\bvomit/i.test(allText)))) {
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
  const HIGH_PATTERNS = [
    { pattern: /\b(fracture|broken\s+bone|dislocation|dislocated|torn\s+ligament|complete\s+tear|acl\s+tear|achilles\s+rupture)\b/i, label: 'Suspected fracture or major tear' },
    { pattern: /\b(can'?t|cannot|unable\s+to)\s+(bear\s+weight|walk|stand|put\s+weight)\b/i, label: 'Inability to bear weight or walk' },
    { pattern: /\b(numbness|loss\s+of\s+sensation|tingling\s+in\s+(?:fingers|toes|foot|hand|leg))\b/i, label: 'Numbness or nerve symptom' },
    { pattern: /\b(joint\s+locked|knee\s+locked|elbow\s+locked|locked\s+joint)\b/i, label: 'Locked joint' }
  ];

  for (const item of HIGH_PATTERNS) {
    if (item.pattern.test(allText)) {
      detectedRedFlags.push(item.label);
      reasoning.push(`High risk indicator: ${item.label}`);
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
