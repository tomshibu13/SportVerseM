/**
 * SportVerse AI - Comprehensive Safety & Medication Automated Test Suite
 * Validates deterministic medication safety gate, red-flag emergency triage,
 * RAG source retrieval, and safe response formats.
 */

const { checkMedicationSafety } = require('../utils/medicationSafetyService');
const { classifyRisk } = require('../utils/safetyEngine');
const { retrieveRelevantKnowledge } = require('../utils/injuryRag');
const mongoose = require('mongoose');
const InjuryKnowledge = require('../models/InjuryKnowledge');

async function runTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING SPORTVERSE AI SAFETY & MEDICATION TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(name, condition, details = '') {
    if (condition) {
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name} -> ${details}`);
      failed++;
    }
  }

  // ── TEST 1: Exact Medication Request ──
  const t1 = checkMedicationSafety('What exact medication and dosage should I take for my ACL injury?');
  assert('1. Exact Medication Request triggers gate', t1.isMedicationRequest === true);
  assert('1. Response Type is MEDICATION_REFUSAL', t1.refusalResponse.responseType === 'MEDICATION_REFUSAL');
  assert('1. No drug names in refusal', !t1.refusalResponse.reply.toLowerCase().includes('paracetamol') && !t1.refusalResponse.reply.toLowerCase().includes('ibuprofen'));

  // ── TEST 2: Dosage Request ──
  const t2 = checkMedicationSafety('What dosage should I take?');
  assert('2. Dosage Request triggers gate', t2.isMedicationRequest === true && t2.refusalResponse.responseType === 'MEDICATION_REFUSAL');

  // ── TEST 3: Ibuprofen Dosage Request ──
  const t3 = checkMedicationSafety('What dosage of ibuprofen should I take?');
  assert('3. Ibuprofen Dosage Request triggers gate', t3.isMedicationRequest === true && t3.refusalResponse.responseType === 'MEDICATION_REFUSAL');

  // ── TEST 4: Paracetamol Request ──
  const t4 = checkMedicationSafety('Can I take paracetamol for my ACL injury?');
  assert('4. Paracetamol Request triggers gate', t4.isMedicationRequest === true && t4.refusalResponse.responseType === 'MEDICATION_REFUSAL');

  // ── TEST 5: Painkiller Recommendation Request ──
  const t5 = checkMedicationSafety('Which painkiller is best?');
  assert('5. Painkiller Recommendation triggers gate', t5.isMedicationRequest === true && t5.refusalResponse.responseType === 'MEDICATION_REFUSAL');

  // ── TEST 6: Antibiotic Request ──
  const t6 = checkMedicationSafety('What antibiotic should I use?');
  assert('6. Antibiotic Request triggers gate', t6.isMedicationRequest === true && t6.refusalResponse.responseType === 'MEDICATION_REFUSAL');

  // ── TEST 7: Steroid Request ──
  const t7 = checkMedicationSafety('Should I take steroids for recovery?');
  assert('7. Steroid Request triggers gate', t7.isMedicationRequest === true && t7.refusalResponse.responseType === 'MEDICATION_REFUSAL');

  // ── TEST 8: Injection Request ──
  const t8 = checkMedicationSafety('Do I need a cortisone injection?');
  assert('8. Injection Request triggers gate', t8.isMedicationRequest === true && t8.refusalResponse.responseType === 'MEDICATION_REFUSAL');

  // ── TEST 9: Medication Schedule Request ──
  const t9 = checkMedicationSafety('How many tablets should I take per day?');
  assert('9. Medication Schedule Request triggers gate', t9.isMedicationRequest === true && t9.refusalResponse.responseType === 'MEDICATION_REFUSAL');

  // ── TEST 10: Normal Ankle Injury Question ──
  const t10_med = checkMedicationSafety('I twisted my ankle during football, there is mild swelling');
  const t10_risk = classifyRisk({
    sport: 'Football',
    bodyPart: 'Ankle',
    injuryMechanism: 'Twisted',
    symptoms: ['mild swelling', 'pain'],
    painLevel: 3,
    mobilityStatus: 'Full'
  });
  assert('10. Normal Ankle Query does NOT trigger medication gate', t10_med.isMedicationRequest === false);
  assert('10. Normal Ankle Query classified as LOW/MODERATE', t10_risk.riskLevel === 'LOW' || t10_risk.riskLevel === 'MODERATE');

  // ── TEST 11: Concussion Question ──
  const t11_risk = classifyRisk({
    sport: 'Football',
    bodyPart: 'Head',
    injuryMechanism: 'Blow to head',
    symptoms: ['dizziness', 'headache'],
    painLevel: 4,
    mobilityStatus: 'Full'
  });
  assert('11. Concussion Query risk classified as MODERATE or HIGH', t11_risk.riskLevel === 'MODERATE' || t11_risk.riskLevel === 'HIGH');

  // ── TEST 12: Urgent Head Injury (Emergency Red Flag) ──
  const t12_risk = classifyRisk({
    sport: 'Football',
    bodyPart: 'Head',
    injuryMechanism: 'Severe collision',
    symptoms: ['unconscious', "can't breathe"],
    painLevel: 10,
    mobilityStatus: 'None'
  });
  assert('12. Urgent Head Injury classified as URGENT', t12_risk.riskLevel === 'URGENT');
  assert('12. Urgent Head Injury responseType is URGENT_SAFETY', t12_risk.responseType === 'URGENT_SAFETY');

  // ── TEST 13: Inability to Bear Weight ──
  const t13_risk = classifyRisk({
    sport: 'Football',
    bodyPart: 'Knee',
    injuryMechanism: 'Twisting with popping sound',
    symptoms: ["can't bear weight", 'popping sound'],
    painLevel: 8,
    mobilityStatus: 'None'
  });
  assert('13. Inability to bear weight classified as HIGH', t13_risk.riskLevel === 'HIGH');
  assert('13. Professional care recommended for HIGH risk', t13_risk.professionalCareRecommended === true);

  // ── TEST 14: Severe Swelling with High Pain ──
  const t14_risk = classifyRisk({
    sport: 'Running',
    bodyPart: 'Knee',
    hasSwelling: true,
    painLevel: 8,
    mobilityStatus: 'Partial'
  });
  assert('14. Severe swelling with pain 8 classified as HIGH', t14_risk.riskLevel === 'HIGH');

  // ── TEST 15: Unrelated Ground Booking Question ──
  const t15_med = checkMedicationSafety('Book football turf in Calicut');
  assert('15. Ground booking does NOT trigger medication gate', t15_med.isMedicationRequest === false);

  // ── TEST 16: RAG Retrieval Test ──
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/sportverse');
    const ragAnkle = await retrieveRelevantKnowledge({ sport: 'Football', bodyPart: 'Ankle', symptoms: ['sprain'] });
    assert('16. RAG retrieves ankle knowledge sources', ragAnkle.sources.length > 0 && ragAnkle.sources.some(s => s.bodyPart === 'Ankle'));

    const ragMed = await retrieveRelevantKnowledge({ sport: 'Football', bodyPart: 'Knee', isMedicationQuery: true });
    assert('17. RAG blocks retrieval when isMedicationQuery is true', ragMed.sources.length === 0 && ragMed.formattedText === '');
    await mongoose.disconnect();
  } catch (err) {
    console.log('MongoDB optional RAG check note:', err.message);
  }

  console.log('\n====================================================');
  console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) process.exit(1);
  process.exit(0);
}

runTests();
