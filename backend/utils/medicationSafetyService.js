/**
 * SportVerse AI - Medication Safety Service
 * Deterministic gate that intercepts any medication/drug/dosage/prescription queries
 * BEFORE RAG retrieval and BEFORE Gemini API calls.
 */

// Regex patterns to detect any medication, dosage, prescription, or drug-related intent
const MEDICATION_PATTERNS = [
  /\b(medication|medications|medicine|medicines|drug|drugs|pill|pills|tablet|tablets|capsule|capsules)\b/i,
  /\b(dosage|dose|doses|dosing|mg|milligram|milligrams|ml|milliliter|milliliters)\b/i,
  /\b(prescribe|prescribes|prescribed|prescription|prescriptions|rx)\b/i,
  /\b(painkiller|painkillers|pain-killer|pain-killers|analgesic|analgesics|nsaid|nsaids)\b/i,
  /\b(antibiotic|antibiotics|amoxicillin|ciprofloxacin|augmentin|azithromycin|penicillin)\b/i,
  /\b(steroid|steroids|corticosteroid|corticosteroids|prednisone|cortisone|dexamethasone)\b/i,
  /\b(injection|injections|shot|shots|inject|injected|prp|epidural)\b/i,
  /\b(paracetamol|acetaminophen|ibuprofen|advil|motrin|diclofenac|volini|moov|naproxen|aleve|aspirin|tramadol|codeine)\b/i,
  /\b(ointment|ointments|gel|gels|cream|creams|spray|sprays)\b/i,
  /\bhow\s+many\s+(pills|tablets|capsules|doses|mg|times\s+a\s+day)\b/i,
  /\bwhat\s+(exact\s+)?(medicine|medication|drug|dosage|pill|tablet|painkiller)\b/i,
  /\bwhich\s+(medicine|medication|drug|painkiller|pill|tablet)\s+(is\s+best|should\s+i\s+take)\b/i,
  /\b(can\s+i\s+take|should\s+i\s+take|give\s+me)\s+(medicine|medication|drugs?|tablets?|pills?|painkillers?)\b/i,
  /\b(medication\s+schedule|drug\s+frequency|how\s+often\s+to\s+take)\b/i,
  /\b(suggest|recommend)\s+(medicine|medication|drugs?|tablets?|pills?|painkillers?)\b/i
];

/**
 * Checks if a user prompt or text contains medication/drug inquiries.
 * @param {string} text - User input message
 * @param {Array} history - Previous conversation messages (optional)
 * @returns {object} { isMedicationRequest: boolean, matchedTerm: string, response: object }
 */
function checkMedicationSafety(text = '', history = []) {
  const combinedText = [
    text,
    ...(Array.isArray(history) ? history.map(h => (h.text || h.content || '')) : [])
  ].join(' ').toLowerCase();

  const userQuery = (text || '').toLowerCase().trim();

  let isMedication = false;
  let matchedPattern = '';

  for (const pattern of MEDICATION_PATTERNS) {
    if (pattern.test(userQuery)) {
      isMedication = true;
      matchedPattern = pattern.toString();
      break;
    }
  }

  // Also catch generic phrases like "what to take", "what should i take" when in medical context
  if (!isMedication) {
    const genericTakePattern = /\b(what\s+should\s+i\s+take|what\s+to\s+take|what\s+can\s+i\s+take)\b/i;
    if (genericTakePattern.test(userQuery)) {
      isMedication = true;
      matchedPattern = 'what should i take';
    }
  }

  if (isMedication) {
    return {
      isMedicationRequest: true,
      matchedPattern,
      refusalResponse: getSafeMedicationRefusal()
    };
  }

  return {
    isMedicationRequest: false,
    matchedPattern: null,
    refusalResponse: null
  };
}

/**
 * Standard deterministic safe medication refusal response.
 * Complies with strict medical safety: NO drug names, NO dosages, NO treatment schedules.
 */
function getSafeMedicationRefusal() {
  const text = 'SportVerse AI cannot recommend a specific medication, drug, dosage, frequency, or prescription. Medication choice depends on factors such as medical history, allergies, other medicines, and the nature of the injury. Please consult a qualified healthcare professional or pharmacist for personalized medication advice.';

  return {
    riskLevel: 'LOW',
    responseType: 'MEDICATION_REFUSAL',
    possibleCategories: [],
    symptomsDetected: [],
    generalGuidance: [
      'SportVerse AI cannot recommend a specific medication, drug, dosage, frequency, or prescription.',
      'Medication choice depends on factors such as medical history, allergies, other medicines, and the nature of the injury.',
      'Please consult a qualified healthcare professional or pharmacist for personalized medication advice.',
      'For acute non-medicinal relief, follow the RICE protocol: Rest, Ice (15–20 min wrapped in cloth), Compression bandage, and Elevation.'
    ],
    thingsToAvoid: [
      'Self-medicating with unprescribed drugs or altering dosages without medical consultation',
      'Relying on painkillers to mask pain and continuing sport or strenuous activity'
    ],
    warningSigns: [
      'Severe or worsening pain',
      'Inability to bear weight or move the joint',
      'Signs of adverse reactions or allergies'
    ],
    professionalCareRecommended: true,
    sources: [],
    disclaimer: 'SportVerse AI provides general sports-health information and does not provide medical diagnosis or personalized medication advice.',
    reply: text,
    suggested_actions: [
      'RICE protocol steps',
      'When to see a doctor?',
      'First aid checklist',
      'Recovery timelines'
    ]
  };
}

module.exports = {
  checkMedicationSafety,
  getSafeMedicationRefusal
};
