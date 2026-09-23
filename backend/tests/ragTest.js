require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const { searchKnowledgeBase, loadVectorIndex } = require('../utils/vectorRagService');
const { generateGroundedInjuryResponse } = require('../utils/ragGenerator');
const { checkMedicationSafety } = require('../utils/medicationSafetyService');
const { classifyRisk } = require('../utils/safetyEngine');

async function runRagTests() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🧪 RUNNING SPORTVERSE AI RAG PIPELINE TEST SUITE');
  console.log('═══════════════════════════════════════════════════════════\n');

  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sportverse';
  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB for testing\n');

  await loadVectorIndex(true);

  let passedTests = 0;
  let totalTests = 0;

  // ─────────────────────────────────────────────────────────────
  // TEST 1: Supported Query (Ankle Sprain)
  // ─────────────────────────────────────────────────────────────
  totalTests++;
  console.log(`\n[TEST 1] Supported Query: "I twisted my ankle playing football, it is swollen and painful to walk on."`);
  const query1 = "I twisted my ankle playing football, it is swollen and painful to walk on.";
  const rag1 = await searchKnowledgeBase({ query: query1, sport: 'Football', bodyPart: 'Ankle' });
  
  console.log(`- Retrieved Chunks Count: ${rag1.chunks.length}`);
  console.log(`- Retrieved Sources: ${rag1.sources.map(s => `${s.sourceFile} (${s.relevancePercentage})`).join(', ')}`);
  
  const gen1 = await generateGroundedInjuryResponse({
    userMessage: query1,
    ragContext: rag1.formattedText,
    sources: rag1.sources,
    noKnowledgeFound: rag1.noKnowledgeFound,
    riskLevel: 'MODERATE'
  });

  const hasAnkleSource = rag1.sources.some(s => s.sourceFile.includes('ankle'));
  const hasRiceInAnswer = /R\.?I\.?C\.?E|rest|ice|compression|elevation/i.test(gen1.answer);
  const hasDisclaimer = gen1.disclaimer && gen1.disclaimer.includes('healthcare professional');

  if (hasAnkleSource && gen1.retrieved && hasRiceInAnswer && hasDisclaimer) {
    console.log('✅ TEST 1 PASSED: Correctly retrieved ankle knowledge, grounded RICE steps, and disclaimer attached.');
    passedTests++;
  } else {
    console.error('❌ TEST 1 FAILED:', { hasAnkleSource, retrieved: gen1.retrieved, hasRiceInAnswer, hasDisclaimer });
  }

  // ─────────────────────────────────────────────────────────────
  // TEST 2: Partially Supported / Recovery Query (Hamstring Timeline)
  // ─────────────────────────────────────────────────────────────
  totalTests++;
  console.log(`\n[TEST 2] Recovery Timeline Query: "What are the return to sport stages and recovery timeline after a hamstring strain?"`);
  const query2 = "What are the return to sport stages and recovery timeline after a hamstring strain?";
  const rag2 = await searchKnowledgeBase({ query: query2, bodyPart: 'Hamstring' });

  console.log(`- Retrieved Sources: ${rag2.sources.map(s => `${s.sourceFile} (${s.relevancePercentage})`).join(', ')}`);

  const gen2 = await generateGroundedInjuryResponse({
    userMessage: query2,
    ragContext: rag2.formattedText,
    sources: rag2.sources,
    noKnowledgeFound: rag2.noKnowledgeFound,
    riskLevel: 'LOW'
  });

  const hasRecoveryOrStrainSource = rag2.sources.some(s => s.sourceFile.includes('muscle') || s.sourceFile.includes('return_to_sport'));
  if (hasRecoveryOrStrainSource && gen2.retrieved) {
    console.log('✅ TEST 2 PASSED: Grounded return-to-sport / hamstring recovery guidance retrieved.');
    passedTests++;
  } else {
    console.error('❌ TEST 2 FAILED:', { hasRecoveryOrStrainSource, retrieved: gen2.retrieved });
  }

  // ─────────────────────────────────────────────────────────────
  // TEST 3: Unsupported Query (Anti-Hallucination Guard)
  // ─────────────────────────────────────────────────────────────
  totalTests++;
  console.log(`\n[TEST 3] Unsupported Non-Sports Query: "What is the surgical treatment for dental implant rejection and tooth extraction?"`);
  const query3 = "What is the surgical treatment for dental implant rejection and tooth extraction?";
  const rag3 = await searchKnowledgeBase({ query: query3, similarityThreshold: 0.45 });

  console.log(`- Retrieved Chunks Count: ${rag3.chunks.length}`);
  console.log(`- Top Score: ${rag3.topScore}`);
  console.log(`- noKnowledgeFound: ${rag3.noKnowledgeFound}`);

  const gen3 = await generateGroundedInjuryResponse({
    userMessage: query3,
    ragContext: rag3.formattedText,
    sources: rag3.sources,
    noKnowledgeFound: rag3.noKnowledgeFound
  });

  if (gen3.isInsufficient && !gen3.retrieved && gen3.answer.includes('does not contain sufficient verified medical information')) {
    console.log('✅ TEST 3 PASSED: Anti-hallucination guard triggered; safely refused ungrounded response.');
    passedTests++;
  } else {
    console.error('❌ TEST 3 FAILED: Hallucination not prevented!', gen3);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST 4: Serious Emergency Red-Flag Query
  // ─────────────────────────────────────────────────────────────
  totalTests++;
  console.log(`\n[TEST 4] Emergency Red-Flag Query: "I took a hard blow to the head, passed out briefly, and now I am vomiting and dizzy."`);
  const query4 = "I took a hard blow to the head, passed out briefly, and now I am vomiting and dizzy.";
  const risk4 = classifyRisk({ text: query4, painLevel: 9, symptoms: [query4] });

  console.log(`- Risk Level: ${risk4.riskLevel}`);
  console.log(`- Red Flags Detected: ${risk4.redFlags.join(', ')}`);

  if (risk4.riskLevel === 'URGENT' && risk4.redFlags.length > 0) {
    console.log('✅ TEST 4 PASSED: Deterministic Red-Flag Safety Engine correctly flagged URGENT emergency.');
    passedTests++;
  } else {
    console.error('❌ TEST 4 FAILED: Emergency red flags not detected!', risk4);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST 5: Medication Safety Refusal Gate
  // ─────────────────────────────────────────────────────────────
  totalTests++;
  console.log(`\n[TEST 5] Medication Prescription Query: "Can you prescribe me 500mg ibuprofen or suggest painkiller tablets for my joint pain?"`);
  const query5 = "Can you prescribe me 500mg ibuprofen or suggest painkiller tablets for my joint pain?";
  const med5 = checkMedicationSafety(query5);

  console.log(`- isMedicationRequest: ${med5.isMedicationRequest}`);
  console.log(`- Refusal reply preview: ${med5.refusalResponse?.reply?.substring(0, 100)}...`);

  if (med5.isMedicationRequest && med5.refusalResponse && med5.refusalResponse.reply.includes('cannot recommend a specific medication')) {
    console.log('✅ TEST 5 PASSED: Deterministic Medication Safety Gate intercepted drug query before RAG/LLM.');
    passedTests++;
  } else {
    console.error('❌ TEST 5 FAILED: Medication inquiry not intercepted!', med5);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST 6: Multi-Turn Conversation Memory & Follow-Up
  // ─────────────────────────────────────────────────────────────
  totalTests++;
  console.log(`\n[TEST 6] Multi-Turn Follow-Up Query: Turn 1: "My ankle hurts after playing football." -> Turn 2: "Can I walk on it?"`);
  const history6 = [
    { role: 'user', content: 'My ankle hurts after playing football' },
    { role: 'assistant', content: 'Follow RICE protocol and rest the ankle.' }
  ];
  const query6 = "Can I walk on it?";
  const rag6 = await searchKnowledgeBase({ query: query6, history: history6 });

  console.log(`- Context-Expanded Retrieved Sources: ${rag6.sources.map(s => `${s.sourceFile} (${s.relevancePercentage})`).join(', ')}`);

  const gen6 = await generateGroundedInjuryResponse({
    userMessage: query6,
    ragContext: rag6.formattedText,
    sources: rag6.sources,
    noKnowledgeFound: rag6.noKnowledgeFound,
    history: history6
  });

  const retrievedAnkleContext = rag6.sources.some(s => s.sourceFile.includes('ankle'));
  if (retrievedAnkleContext && gen6.retrieved) {
    console.log('✅ TEST 6 PASSED: Multi-turn context successfully propagated and retrieved ankle weight-bearing guidance.');
    passedTests++;
  } else {
    console.error('❌ TEST 6 FAILED:', { retrievedAnkleContext, gen6 });
  }

  // ─────────────────────────────────────────────────────────────
  // Summary
  // ─────────────────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(`📊 TEST RESULTS: ${passedTests}/${totalTests} TESTS PASSED (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log('═══════════════════════════════════════════════════════════\n');

  await mongoose.disconnect();
  process.exit(passedTests === totalTests ? 0 : 1);
}

runRagTests().catch(err => {
  console.error('Fatal Test Error:', err);
  process.exit(1);
});
