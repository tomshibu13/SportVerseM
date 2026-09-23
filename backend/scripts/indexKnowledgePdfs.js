require('dotenv').config({ path: __dirname + '/../.env' });
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { PDFParse } = require('pdf-parse');
const InjuryKnowledge = require('../models/InjuryKnowledge');
const { generateEmbedding } = require('../utils/vectorRagService');

// Metadata mapping for authentic curated sports-injury PDFs
const PDF_METADATA_MAP = {
  '01_general_sports_injuries.pdf': {
    injuryName: 'General Sports Injuries & Acute First Aid',
    category: 'General Sports Injuries & First Aid',
    bodyPart: 'General',
    sport: ['Football', 'Cricket', 'Badminton', 'Basketball', 'Running', 'Tennis', 'All'],
    source: '01_general_sports_injuries.pdf (NIH NIAMS Sports Injuries Guide)',
    sourceUrl: 'https://www.niams.nih.gov/health-topics/sports-injuries',
    symptoms: ['Acute pain', 'Swelling', 'Localized tenderness', 'Stiffness', 'Bruising', 'Reduced range of motion'],
    causes: ['Direct impact or collision', 'Sudden twist or change in direction', 'Fall onto hard surface', 'Overuse without adequate recovery'],
    immediateCare: [
      'Stop sporting activity immediately',
      'Follow R.I.C.E: Rest, Ice (15–20 min wrapped in cloth), Compression bandage, Elevation',
      'Avoid direct heat, alcohol, vigorous running, and aggressive massage in the first 48 hours'
    ],
    recoveryGuidance: [
      'Gradually restore gentle active range of motion once sharp pain subsides',
      'Progress from non-weight-bearing to partial, then full functional movement',
      'Do not return to competitive play while limping or experiencing acute swelling'
    ],
    prevention: [
      'Perform a dynamic warm-up before sports',
      'Gradually increase training intensity and volume (progressive overload)',
      'Wear sport-appropriate footwear and protective equipment'
    ],
    warningSigns: [
      'Severe pain (8-10/10) or inability to bear weight',
      'Visible deformity or unnatural joint angle',
      'Numbness, loss of sensation, or cold limb',
      'Rapid severe swelling or joint effusion'
    ],
    whenToSeekDoctor: [
      'Inability to walk or put weight on the affected limb',
      'Severe or worsening swelling that does not improve after 48 hours',
      'Audible popping or snap heard at moment of injury',
      'Suspected fracture or joint dislocation'
    ],
    tags: ['first aid', 'rice', 'acute injury', 'sprain', 'strain', 'general', 'sports injury', 'swelling', 'rest', 'ice']
  },

  '02_ankle_injuries.pdf': {
    injuryName: 'Ankle Sprains & Ligament Injuries',
    category: 'Ankle Sprains & Ligament Injuries',
    bodyPart: 'Ankle',
    sport: ['Football', 'Basketball', 'Running', 'Tennis', 'Badminton', 'Volleyball'],
    source: '02_ankle_injuries.pdf (NIH NIAMS Ankle Injuries Reference)',
    sourceUrl: 'https://www.niams.nih.gov/health-topics/sports-injuries',
    symptoms: ['Lateral ankle pain', 'Rapid ankle swelling', 'Bruising around outer malleolus', 'Stiffness', 'Difficulty bearing weight'],
    causes: ['Inversion injury (ankle rolling inward)', 'Awkward landing from jump', 'Stepping into a turf depression', 'Sudden pivot on planted foot'],
    immediateCare: [
      'Cease all running and jumping immediately',
      'Apply cold compression with ice wrapped in a damp cloth for 15–20 minutes every 2–3 hours',
      'Wrap ankle with an elastic support bandage (ensure not too tight)',
      'Elevate foot above heart level when lying or resting'
    ],
    recoveryGuidance: [
      'Grade 1 (Mild): 1–2 weeks conservative RICE and gentle ankle circles',
      'Grade 2 (Moderate): 3–6 weeks with ankle brace, progressive balance exercises, and strength rehab',
      'Grade 3 (Severe tear): 8–12+ weeks, orthopedic consultation, structured physical therapy',
      'Return to sport milestone: Able to perform single-leg hopping and directional pivots pain-free'
    ],
    prevention: [
      'Proprioceptive balance training on balance board / single leg stands',
      'Calf and peroneal strengthening exercises',
      'Supportive court/turf shoes with proper lateral stability',
      'Taping or ankle brace for athletes with recurrent ankle sprain history'
    ],
    warningSigns: [
      'Inability to take 4 steps immediately after injury (Ottawa Ankle Rules)',
      'Severe bony tenderness over posterior edge of lateral or medial malleolus',
      'Foot or toe numbness and tingling',
      'Complete joint instability or gross deformity'
    ],
    whenToSeekDoctor: [
      'Inability to bear any weight on the foot',
      'Severe pain localized to ankle bones (suspected fracture)',
      'No improvement in swelling or mobility after 5–7 days',
      'Repeated feeling of the ankle "giving way"'
    ],
    tags: ['ankle', 'sprain', 'inversion', 'foot', 'ankle roll', 'ankle twist', 'swelling', 'bruising', 'ligament', 'malleolus', 'ottawa rules', 'can i walk']
  },

  '03_knee_injuries.pdf': {
    injuryName: 'Knee & Ligament Injuries (ACL, PCL, MCL, Meniscus)',
    category: 'Knee & Ligament Injuries',
    bodyPart: 'Knee',
    sport: ['Football', 'Basketball', 'Cricket', 'Running', 'Tennis', 'Badminton'],
    source: '03_knee_injuries.pdf (NIH NIAMS Knee Injuries Clinical Guide)',
    sourceUrl: 'https://www.niams.nih.gov/health-topics/sports-injuries',
    symptoms: ['Deep knee pain', 'Immediate or rapid knee swelling (hemarthrosis)', 'Audible popping sensation', 'Knee locking or catching', 'Giving way / knee buckling'],
    causes: ['Non-contact deceleration and sudden change in direction (ACL)', 'Valgus stress / direct blow to outside of knee (MCL)', 'Twisting on a planted foot with knee bent (Meniscus)', 'Hyperextension or direct dashboard/turf blow (PCL)'],
    immediateCare: [
      'Stop activity immediately; do NOT attempt to play through knee instability',
      'Immobilize the knee in a comfortable position with support',
      'Apply cold pack wrapped in cloth for 15–20 minutes',
      'Keep leg elevated and avoid bearing weight until evaluated'
    ],
    recoveryGuidance: [
      'Meniscus / Mild MCL: Conservative rehab, quadriceps strengthening, range-of-motion restoration',
      'ACL tear / Complete ligament rupture: Orthopedic evaluation for surgical vs conservative management',
      'Rehabilitation phases: Reduce swelling -> Restore full extension -> Hamstring/Quad strength -> Agility & jump landing mechanics',
      'Return to sport clearance: Orthopedic clearance + Passing functional hop testing symmetry (>90%)'
    ],
    prevention: [
      'Neuromuscular training programs (e.g. FIFA 11+ knee injury prevention)',
      'Hamstring-to-quadriceps strength balance drills',
      'Proper landing technique with knees tracking over toes, avoiding knee valgus'
    ],
    warningSigns: [
      'Audible loud pop accompanied by immediate severe swelling within 2 hours',
      'Mechanical locking where knee cannot be fully straightened',
      'Knee buckles or gives way during normal walking',
      'Severe knee joint deformity or inability to move leg'
    ],
    whenToSeekDoctor: [
      'Loud pop felt or heard inside the joint',
      'Rapid swelling developing within a few hours of trauma',
      'Inability to fully extend or bend the knee (locked knee)',
      'Persistent instability or feeling of knee giving out'
    ],
    tags: ['knee', 'acl', 'pcl', 'mcl', 'lcl', 'meniscus', 'patella', 'pop', 'popping sound', 'knee twist', 'locking', 'giving way', 'runner knee', 'jumper knee']
  },

  '04_muscle_strains.pdf': {
    injuryName: 'Muscle Strains & Tears (Hamstring, Quadriceps, Calf, Groin)',
    category: 'Muscle Strains & Tears',
    bodyPart: 'Hamstring, Thigh, Calf, Groin',
    sport: ['Football', 'Running', 'Cricket', 'Basketball', 'Track & Field'],
    source: '04_muscle_strains.pdf (NIH NIAMS Muscle Injury Protocol)',
    sourceUrl: 'https://www.niams.nih.gov/health-topics/sports-injuries',
    symptoms: ['Sudden sharp pain during sprint or kick', 'Sensation of a pull, snap, or pop in muscle', 'Localized tenderness and muscle spasm', 'Bruising appearing days later', 'Loss of muscle strength'],
    causes: ['High-speed sprinting (hamstring eccentric contraction)', 'Sudden explosive acceleration or deceleration', 'Over-stretching beyond normal muscle elasticity', 'Fatigue and inadequate warmup'],
    immediateCare: [
      'Stop sprinting and sit down immediately',
      'Apply cold pack wrapped in cloth for 15–20 minutes',
      'Wrap with a compression bandage around the thigh/calf to contain swelling',
      'Avoid aggressive stretching of the strained muscle during the acute 48-hour phase'
    ],
    recoveryGuidance: [
      'Grade 1 (Mild strain): 1–3 weeks with gentle active mobility and isometric contractions',
      'Grade 2 (Moderate tear): 4–8 weeks with progressive eccentric loading (Nordic hamstring curls) and jogging progression',
      'Grade 3 (Severe complete tear): 8–16+ weeks, specialist evaluation, structured physiotherapy',
      'Return to sport: Pain-free full sprint, symmetrical strength, and high-speed directional changes'
    ],
    prevention: [
      'Eccentric strength training (Nordic hamstring curls, Copenhagen adduction for groin)',
      'Comprehensive dynamic warmup with progressive sprint buildups',
      'Proper workload management avoiding sudden spikes in high-speed running volume'
    ],
    warningSigns: [
      'Palpable defect or "gap" in muscle belly accompanied by large hematoma/bruising',
      'Inability to walk without significant limp',
      'Severe pain resisting any muscle contraction',
      'Numbness radiating down the leg'
    ],
    whenToSeekDoctor: [
      'Visible muscle bunching or indentation (possible high-grade tear)',
      'Significant bruising spreading down past the knee or ankle',
      'Persistent severe pain or weakness after 7–10 days',
      'Recurrent strain in the exact same muscle location'
    ],
    tags: ['muscle', 'strain', 'hamstring', 'quad', 'quadriceps', 'calf', 'groin', 'tear', 'pulled muscle', 'sprint', 'pull', 'thigh', 'nordic']
  },

  '05_shoulder_injuries.pdf': {
    injuryName: 'Shoulder & Rotator Cuff Injuries (Impingement, Dislocation)',
    category: 'Shoulder & Rotator Cuff Injuries',
    bodyPart: 'Shoulder',
    sport: ['Badminton', 'Cricket', 'Tennis', 'Swimming', 'Volleyball'],
    source: '05_shoulder_injuries.pdf (NIH NIAMS Shoulder Disorders Reference)',
    sourceUrl: 'https://www.niams.nih.gov/health-topics/sports-injuries',
    symptoms: ['Pain during overhead strokes / throws / smash', 'Night pain when sleeping on affected shoulder', 'Weakness lifting arm', 'Clicking or popping sensation in shoulder joint', 'Restricted range of motion'],
    causes: ['Repetitive overhead strokes (badminton smash, tennis serve, cricket bowling)', 'Fall onto outstretched hand (dislocation / labral tear)', 'Rotator cuff tendon overload and subacromial impingement'],
    immediateCare: [
      'Rest the arm and avoid all overhead reaching and throwing',
      'Support arm in a relaxed position or temporary sling if painful',
      'Apply ice for 15–20 minutes wrapped in a cloth',
      'Do not attempt to self-reduce or pull a suspected dislocated shoulder'
    ],
    recoveryGuidance: [
      'Rotator cuff tendinopathy / Impingement: 4–8 weeks conservative rehabilitation, rotator cuff and scapular stabilization',
      'Shoulder subluxation / Dislocation: Physician reduction, immobilization period, then 8–12 weeks progressive rotator cuff strengthening',
      'Return to sport: Pain-free overhead range of motion and rotator cuff strength symmetry'
    ],
    prevention: [
      'Scapular stabilization exercises (Y-T-W drills)',
      'Rotator cuff internal/external rotation resistance band training',
      'Proper stroke and throwing biomechanics avoiding excessive shoulder abduction'
    ],
    warningSigns: [
      'Square appearance of shoulder contour (suspected dislocation)',
      'Inability to move arm or severe numbness/weakness in hand or fingers',
      'Intense, unremitting pain after a collision or fall'
    ],
    whenToSeekDoctor: [
      'Suspected joint dislocation (Emergency clinic evaluation required immediately)',
      'Arm numbness or tingling in fingers',
      'Inability to lift arm above 90 degrees',
      'No improvement after 2 weeks of conservative rest'
    ],
    tags: ['shoulder', 'rotator cuff', 'dislocation', 'impingement', 'overhead', 'smash', 'throw', 'badminton', 'tennis', 'arm', 'clicking shoulder']
  },

  '06_sports_concussion.pdf': {
    injuryName: 'Sports Concussion & Head Trauma',
    category: 'Sports Concussion & Head Trauma',
    bodyPart: 'Head',
    sport: ['Football', 'Cricket', 'Basketball', 'All Sports'],
    source: '06_sports_concussion.pdf (CDC HEADS UP Concussion Protocol)',
    sourceUrl: 'https://www.cdc.gov/heads-up/',
    symptoms: ['Headache', 'Dizziness or balance problems', 'Nausea or vomiting', 'Confusion or memory loss', 'Sensitivity to light and noise', 'Feeling sluggish or foggy', 'Loss of consciousness'],
    causes: ['Direct blow to head, face, or neck', 'Hard impact to body transmitting impulsive force to head (whiplash effect)', 'Collision with another player, ball, or turf'],
    immediateCare: [
      'IMMEDIATELY REMOVE FROM PLAY ("When in doubt, sit them out")',
      'Do NOT allow athlete to return to play or drive on the same day',
      'Keep athlete calm and monitored by an adult',
      'Seek prompt medical evaluation by a qualified healthcare provider'
    ],
    recoveryGuidance: [
      'Initial 24–48 hours: Physical and cognitive rest (limited screens, resting quietly)',
      'Gradual 6-step Return to Play Protocol under medical supervision:',
      'Step 1: Symptom-limited light daily activity',
      'Step 2: Light aerobic exercise (stationary cycling, walking)',
      'Step 3: Sport-specific non-contact drills',
      'Step 4: Non-contact training drills with teammates',
      'Step 5: Full-contact practice following medical clearance',
      'Step 6: Return to competitive play'
    ],
    prevention: [
      'Enforce fair play and safety rules (no illegal head tackles)',
      'Wear properly fitted sport helmets / headgear where indicated',
      'Neck strengthening exercises to reduce rotational head accelerations'
    ],
    warningSigns: [
      'Loss of consciousness (even brief)',
      'Repeated vomiting or severe worsening headache',
      'Unequal pupil size',
      'Drowsiness or inability to wake up',
      'Slurred speech, weakness, numbness, or decreased coordination',
      'Convulsions or seizures'
    ],
    whenToSeekDoctor: [
      'ALL suspected concussions require evaluation by a licensed healthcare professional',
      'Emergency room immediately if ANY red flag is present (loss of consciousness, seizures, vomiting, slurred speech)'
    ],
    tags: ['concussion', 'head', 'head blow', 'dizzy', 'dizziness', 'headache', 'brain', 'loss of consciousness', 'unconscious', 'vomit', 'memory loss', 'confusion', 'cdc heads up']
  },

  '07_heat_illness.pdf': {
    injuryName: 'Heat Illness & Heat Exhaustion in Sports',
    category: 'Heat Illness & Environmental Safety',
    bodyPart: 'General',
    sport: ['Running', 'Football', 'Cricket', 'Tennis', 'All outdoor sports'],
    source: '07_heat_illness.pdf (CDC Heat & Athletes Guidelines)',
    sourceUrl: 'https://www.cdc.gov/heat-health/risk-factors/heat-and-athletes.html',
    symptoms: ['Heavy sweating or sudden cessation of sweating', 'Dizziness, lightheadedness, and weakness', 'Nausea, vomiting, and muscle cramps', 'Headache and rapid pulse', 'Confusion or fainting (Heat Stroke)'],
    causes: ['Strenuous exercise in high temperature / high humidity', 'Inadequate hydration and lack of acclimatization', 'Wearing heavy, non-breathable sports gear'],
    immediateCare: [
      'Stop all physical activity immediately',
      'Move to a cool, shaded, or air-conditioned area',
      'Remove excess clothing and sports gear',
      'Cool athlete with cold water, wet towels, ice bags in armpits/neck, and fanning',
      'Provide sips of cool water or electrolyte drink if conscious and not vomiting'
    ],
    recoveryGuidance: [
      'Full rest until completely asymptomatic',
      'Rehydrate steadily with balanced electrolyte fluids',
      'Acclimatize gradually over 10–14 days before returning to intense outdoor training in hot conditions'
    ],
    prevention: [
      'Schedule practices during cooler morning or evening hours',
      'Mandatory regular hydration breaks every 15–20 minutes',
      'Lightweight, breathable, moisture-wicking clothing',
      'Monitor wet bulb globe temperature (WBGT) and adjust training intensity'
    ],
    warningSigns: [
      'Core body temperature > 104°F (40°C) — Heat Stroke Emergency',
      'Confusion, agitation, bizarre behavior, or delirium',
      'Loss of consciousness or seizures',
      'Hot, red, dry skin or rapid shallow breathing'
    ],
    whenToSeekDoctor: [
      'Heat stroke symptoms require IMMEDIATE 911 / 112 emergency medical dispatch',
      'Heat exhaustion symptoms that do not improve within 30 minutes of cooling and rest',
      'Athlete is unable to keep fluids down due to vomiting'
    ],
    tags: ['heat', 'heat illness', 'heat exhaustion', 'heat stroke', 'cramps', 'temperature', 'sun stroke', 'dehydration', 'hot weather']
  },

  '08_dehydration.pdf': {
    injuryName: 'Dehydration & Fluid Balance in Athletic Performance',
    category: 'Hydration & Performance Physiology',
    bodyPart: 'General',
    sport: ['All Sports', 'Running', 'Football', 'Cricket', 'Basketball'],
    source: '08_dehydration.pdf (CDC Hydration & Sports Physiology Reference)',
    sourceUrl: 'https://www.cdc.gov/heat-health/risk-factors/heat-and-athletes.html',
    symptoms: ['Excessive thirst and dry mouth', 'Fatigue, sluggishness, and reduced athletic performance', 'Dark-colored urine', 'Muscle cramping', 'Dizziness and headache'],
    causes: ['High sweat rate during prolonged intense exercise', 'Exercising in hot/humid conditions without regular fluid intake', 'Poor pre-exercise hydration status'],
    immediateCare: [
      'Pause activity and rest in shade',
      'Drink water or electrolyte-carbohydrate sports beverages in moderate sips',
      'Stretch and massage cramping muscles gently'
    ],
    recoveryGuidance: [
      'Rehydrate steadily post-exercise until urine color is pale light yellow',
      'Include dietary sodium/electrolytes to aid fluid retention'
    ],
    prevention: [
      'Drink 400–600 ml water 2 hours before exercise',
      'Drink 150–250 ml fluid every 15–20 minutes during play',
      'Check morning urine color (pale yellow indicates good hydration)'
    ],
    warningSigns: [
      'Severe dizziness, fainting, or disorientation',
      'Extreme weakness with inability to stand',
      'Absence of urination for prolonged period'
    ],
    whenToSeekDoctor: [
      'Severe dehydration requiring intravenous (IV) fluid resuscitation',
      'Accompanied by heat illness red flags or persistent vomiting'
    ],
    tags: ['dehydration', 'fluids', 'water', 'electrolytes', 'thirst', 'dry mouth', 'cramps', 'hydration', 'urine']
  },

  '09_return_to_sport.pdf': {
    injuryName: 'Return to Sport & Progressive Athletic Rehabilitation',
    category: 'Rehabilitation & Return to Play Protocols',
    bodyPart: 'General',
    sport: ['All Sports'],
    source: '09_return_to_sport.pdf (NCBI PMC Return to Sport Framework)',
    sourceUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8811513/',
    symptoms: ['Post-injury deconditioning', 'Apprehension or fear of reinjury', 'Residual stiffness or mild swelling after activity'],
    causes: ['Premature return to competition before tissues have remodeled and strength is restored'],
    immediateCare: [
      'Do not jump directly from resting back into competitive matchplay',
      'Consult sports physiotherapist for functional objective testing'
    ],
    recoveryGuidance: [
      'Stage 1: Restoration of full pain-free passive and active Range of Motion (ROM)',
      'Stage 2: Basic strength and neuromuscular motor control symmetry (>90% compared to uninjured side)',
      'Stage 3: Sport-specific non-contact drills (jogging, directional changes, ball handling)',
      'Stage 4: Full-contact practice participation without symptoms during or after',
      'Stage 5: Full return to competitive sport'
    ],
    prevention: [
      'Continue maintenance strength and mobility exercises even after return to sport',
      'Monitor workload and avoid sudden acute-to-chronic workload spikes'
    ],
    warningSigns: [
      'Joint swelling or effusion reoccurring after light training',
      'Sharp pain returning during running or pivoting',
      'Joint instability or feeling of giving way'
    ],
    whenToSeekDoctor: [
      'Re-injury or recurrent swelling during progression',
      'Persistent joint weakness or failure to achieve functional milestones'
    ],
    tags: ['return to sport', 'recovery', 'rehabilitation', 'rehab', 'timeline', 'recovery days', 'when can i play', 'progress', 'stages']
  },

  '10_injury_prevention.pdf': {
    injuryName: 'Sports Injury Prevention & Athletic Conditioning',
    category: 'Injury Prevention & Athletic Conditioning',
    bodyPart: 'General',
    sport: ['All Sports'],
    source: '10_injury_prevention.pdf (NIH NIAMS Injury Prevention Protocols)',
    sourceUrl: 'https://www.niams.nih.gov/health-topics/sports-injuries',
    symptoms: ['Overuse soreness', 'Chronic muscular fatigue', 'Tightness predisposed to acute tears'],
    causes: ['Inadequate warmup', 'Muscle imbalances and poor core stability', 'Improper technique / equipment', 'Overtraining and insufficient sleep'],
    immediateCare: [
      'Implement active recovery sessions, adequate sleep (7–9 hrs), and balanced nutrition'
    ],
    recoveryGuidance: [
      'Incorporate 1–2 complete rest or active recovery days per week',
      'Cross-train with low-impact activities (swimming, cycling) to maintain fitness while resting high-impact joints'
    ],
    prevention: [
      'Dynamic Warmup (10–15 min): Jogging, high knees, butt kicks, lunges, leg swings before every session',
      'Strength & Conditioning: Core stability, posterior chain strengthening (hamstrings, glutes), and single-leg balance',
      'Proper Footwear: Replace running/court shoes every 500 km or when cushioning wears down',
      'Post-Activity Cool Down: 5–10 min light jog followed by static stretching of major muscle groups'
    ],
    warningSigns: [
      'Persistent localized pain that worsens with every training session (suspected stress fracture or chronic tendinopathy)'
    ],
    whenToSeekDoctor: [
      'Pain that disrupts normal daily walking, sleeping, or does not improve with 7 days of active rest'
    ],
    tags: ['prevention', 'prevent', 'warmup', 'warm up', 'stretching', 'cool down', 'mobility', 'strength', 'conditioning', 'gear', 'footwear']
  }
};

/**
 * Creates logical chunk objects from the document text
 */
function createLogicalChunks(meta, cleanContent) {
  const chunks = [];

  // Chunk 1: Overview & Symptoms
  chunks.push({
    chunkId: `${meta.source}_chunk_symptoms`,
    title: meta.injuryName,
    section: 'Symptoms, Causes & Clinical Identification',
    text: `Topic: ${meta.injuryName} (${meta.bodyPart}). Applicable Sports: ${meta.sport.join(', ')}.\n` +
      `Symptoms: ${meta.symptoms.join(', ')}.\n` +
      `Causes and Mechanisms: ${meta.causes.join('; ')}.\n` +
      `Clinical Context: ${cleanContent.substring(0, 450)}`
  });

  // Chunk 2: Immediate First Aid & Care (R.I.C.E)
  chunks.push({
    chunkId: `${meta.source}_chunk_care`,
    title: meta.injuryName,
    section: 'Immediate First Aid & Acute Management (R.I.C.E)',
    text: `Immediate Care Protocol for ${meta.injuryName} (${meta.bodyPart}):\n` +
      meta.immediateCare.map(c => `• ${c}`).join('\n') +
      `\nGeneral Care Principles: Do not apply direct heat or massage acute swelling. Rest and protect the joint.`
  });

  // Chunk 3: Recovery Timeline & Return to Sport
  chunks.push({
    chunkId: `${meta.source}_chunk_recovery`,
    title: meta.injuryName,
    section: 'Recovery Milestones & Return to Sport Progression',
    text: `Recovery and Rehabilitation Guidelines for ${meta.injuryName}:\n` +
      meta.recoveryGuidance.map(r => `• ${r}`).join('\n') +
      `\nReturn to play must be criterion-based rather than fixed calendar days.`
  });

  // Chunk 4: Warning Signs, Red Flags & When to Consult Doctor
  chunks.push({
    chunkId: `${meta.source}_chunk_warnings`,
    title: meta.injuryName,
    section: 'Warning Signs, Red Flags & When to Seek Medical Evaluation',
    text: `Emergency Red Flags & Doctor Referral for ${meta.injuryName} (${meta.bodyPart}):\n` +
      `Red Flags:\n` + meta.warningSigns.map(w => `• ${w}`).join('\n') +
      `\nWhen to Consult a Physician or Physiotherapist:\n` + meta.whenToSeekDoctor.map(d => `• ${d}`).join('\n')
  });

  // Chunk 5: Prevention & Conditioning
  chunks.push({
    chunkId: `${meta.source}_chunk_prevention`,
    title: meta.injuryName,
    section: 'Injury Prevention, Warm-up & Conditioning',
    text: `Injury Prevention Strategies for ${meta.injuryName} (${meta.bodyPart}):\n` +
      meta.prevention.map(p => `• ${p}`).join('\n')
  });

  return chunks;
}

async function indexKnowledgeBase() {
  try {
    console.log('🚀 Starting Knowledge PDF Vector & Structured Indexing...');
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sportverse';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB:', mongoUri);

    const dir = path.join(__dirname, '../knowledge');
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.pdf'));
    console.log(`Found ${files.length} knowledge PDFs to process.`);

    // Clear previous index
    await InjuryKnowledge.deleteMany({});
    console.log('Cleared previous InjuryKnowledge collection.');

    const documentsToInsert = [];

    for (const filename of files) {
      console.log(`\n📄 Processing: ${filename}...`);
      const filePath = path.join(dir, filename);
      const buffer = fs.readFileSync(filePath);
      const parser = new PDFParse(new Uint8Array(buffer));
      const parsed = await parser.getText();
      const rawText = parsed.text || '';

      const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
      const cleanContent = lines.filter(l => !l.includes('-- 1 of 1 --') && !l.includes('SportVerse AI — Curated')).join('\n');

      const meta = PDF_METADATA_MAP[filename] || {
        injuryName: filename.replace('.pdf', '').replace(/^\d+_/, '').replace(/_/g, ' '),
        category: 'Sports Medicine',
        bodyPart: 'General',
        sport: ['All Sports'],
        source: filename,
        sourceUrl: '',
        symptoms: ['Pain', 'Swelling'],
        causes: ['Physical trauma or exertion'],
        immediateCare: ['Apply RICE protocol'],
        recoveryGuidance: ['Progressive return to activity'],
        prevention: ['Dynamic warmup and conditioning'],
        warningSigns: ['Severe pain or numbness'],
        whenToSeekDoctor: ['If pain persists or inability to function'],
        tags: []
      };

      // Create logical chunks
      const chunks = createLogicalChunks(meta, cleanContent);

      console.log(`   Generating vector embeddings for ${chunks.length} chunks...`);
      for (const chunk of chunks) {
        try {
          const embeddingText = `${chunk.title} - ${chunk.section}: ${chunk.text}`;
          chunk.embedding = await generateEmbedding(embeddingText);
          // Short delay to avoid rate limiting
          await new Promise(r => setTimeout(r, 150));
        } catch (embedErr) {
          console.warn(`   [Warning] Chunk embedding failed for ${chunk.chunkId}:`, embedErr.message);
          chunk.embedding = [];
        }
      }

      // Generate document-level embedding
      let documentEmbedding = [];
      try {
        const fullDocText = `${meta.injuryName} (${meta.bodyPart}): ${meta.symptoms.join(', ')}. ${meta.immediateCare.join(' ')}. ${cleanContent.substring(0, 500)}`;
        documentEmbedding = await generateEmbedding(fullDocText);
        await new Promise(r => setTimeout(r, 150));
      } catch (_) {}

      const entry = {
        injuryName: meta.injuryName,
        category: meta.category,
        bodyPart: meta.bodyPart,
        sport: meta.sport,
        symptoms: meta.symptoms,
        causes: meta.causes,
        immediateCare: meta.immediateCare,
        recoveryGuidance: meta.recoveryGuidance,
        prevention: meta.prevention,
        warningSigns: meta.warningSigns,
        whenToSeekDoctor: meta.whenToSeekDoctor,
        source: meta.source,
        sourceFile: filename,
        sourceUrl: meta.sourceUrl,
        version: '1.0.0',
        contentVersionDate: new Date('2026-09-15'),
        content: cleanContent,
        tags: meta.tags,
        chunks: chunks,
        documentEmbedding: documentEmbedding
      };

      documentsToInsert.push(entry);
    }

    const inserted = await InjuryKnowledge.insertMany(documentsToInsert);
    console.log(`\n🎉 Successfully indexed ${inserted.length} structured sports injury documents with vector embeddings into MongoDB!`);

    let totalChunks = 0;
    inserted.forEach(doc => {
      totalChunks += doc.chunks.length;
      console.log(`   - 📄 [${doc.sourceFile}] ${doc.injuryName} (${doc.bodyPart}) -> ${doc.chunks.length} chunks indexed`);
    });
    console.log(`Total vector chunks indexed: ${totalChunks}`);

    await mongoose.disconnect();
    console.log('MongoDB connection closed.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during knowledge base indexing:', err);
    process.exit(1);
  }
}

indexKnowledgeBase();
