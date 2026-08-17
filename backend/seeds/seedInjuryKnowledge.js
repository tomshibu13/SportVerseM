require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const InjuryKnowledge = require('../models/InjuryKnowledge');

const seedData = [
  { sport: 'Football', bodyPart: 'Ankle', category: 'Ankle Sprain', content: 'Ankle sprains are the most common football injury. They occur when the ligaments surrounding the ankle are stretched or torn, typically when the foot rolls inward (inversion sprain). Grades range from I (mild stretch) to III (complete tear).', tags: ['sprain', 'swelling', 'pain', 'ankle'], guidance: ['Apply ice for 15-20 min every 2-3 hours', 'Keep ankle elevated above heart level', 'Use compression bandage', 'Avoid weight-bearing until evaluated'], redFlags: ['Inability to bear any weight', 'Gross deformity', 'Numbness in foot', 'Severe bruising extending up the calf'] },
  { sport: 'Football', bodyPart: 'Knee', category: 'ACL Tear', content: 'Anterior Cruciate Ligament tear often happens with sudden stops or changes in direction. Often accompanied by a loud pop and immediate severe swelling.', tags: ['knee', 'pop', 'swelling', 'instability'], guidance: ['Stop play immediately', 'Immobilize the knee', 'Apply ice', 'Seek urgent medical evaluation'], redFlags: ['Loud pop heard', 'Immediate massive swelling', 'Knee gives way when bearing weight'] },
  { sport: 'Football', bodyPart: 'Shoulder', category: 'Shoulder Dislocation', content: 'Happens when the humerus head comes out of the socket, often from a hard fall or tackle.', tags: ['shoulder', 'deformity', 'pain', 'immobility'], guidance: ['Do not try to pop it back in yourself', 'Immobilize arm against chest', 'Apply ice to reduce pain', 'Go to ER immediately'], redFlags: ['Visible deformity', 'Loss of feeling in arm/fingers', 'Severe pain'] },
  { sport: 'Badminton', bodyPart: 'Shoulder', category: 'Rotator Cuff Strain', content: 'Overuse injury from repetitive overhead strokes (smashes, clears).', tags: ['shoulder', 'ache', 'weakness'], guidance: ['Rest from overhead activities', 'Ice after playing', 'Gentle stretching'], redFlags: ['Inability to lift arm', 'Pain that wakes you at night'] },
  { sport: 'Badminton', bodyPart: 'Wrist', category: 'Wrist Sprain', content: 'Common from repetitive flicking motions or falling on an outstretched hand.', tags: ['wrist', 'pain', 'swelling'], guidance: ['Rest and brace the wrist', 'Ice therapy'], redFlags: ['Numbness in fingers', 'Severe swelling', 'Bone visibly out of place'] },
  { sport: 'Badminton', bodyPart: 'Ankle', category: 'Achilles Tendinopathy', content: 'Overuse of the Achilles tendon from excessive jumping and lunging.', tags: ['heel', 'ankle', 'stiffness', 'pain'], guidance: ['Rest and modify activity', 'Heel lifts in shoes', 'Eccentric calf exercises'], redFlags: ['Sudden sharp pain in calf/heel', 'Loud snap heard (possible rupture)'] },
  { sport: 'Cricket', bodyPart: 'Finger', category: 'Dislocated Finger', content: 'Common when catching a hard ball awkwardly.', tags: ['finger', 'deformity', 'pain', 'swelling'], guidance: ['Splint the finger', 'Apply ice', 'Seek medical help to relocate'], redFlags: ['Bone exposed', 'Loss of sensation', 'Cold, pale finger'] },
  { sport: 'Cricket', bodyPart: 'Shoulder', category: 'Thrower\'s Shoulder', content: 'Overuse injury from repetitive throwing.', tags: ['shoulder', 'pain', 'throwing'], guidance: ['Rest and rehab rotator cuff', 'Improve throwing mechanics'], redFlags: ['Sharp pain when releasing ball', 'Numbness in arm'] },
  { sport: 'Cricket', bodyPart: 'Back', category: 'Lumbar Stress Fracture', content: 'Common in fast bowlers due to repetitive extension and rotation.', tags: ['back', 'pain', 'bowling'], guidance: ['Immediate cessation of bowling', 'Core strengthening', 'Medical assessment required'], redFlags: ['Pain radiating down legs', 'Numbness in groin or legs', 'Loss of bowel/bladder control'] },
  { sport: 'Basketball', bodyPart: 'Ankle', category: 'Inversion Sprain', content: 'Landing on another player\'s foot is a common cause.', tags: ['ankle', 'sprain', 'swelling'], guidance: ['RICE protocol', 'Wear ankle brace when returning'], redFlags: ['Cannot walk 4 steps', 'Extreme tenderness over bone'] },
  { sport: 'Basketball', bodyPart: 'Knee', category: 'Patellar Tendinitis (Jumper\'s Knee)', content: 'Inflammation of tendon connecting kneecap to shinbone from repetitive jumping.', tags: ['knee', 'pain', 'jumping'], guidance: ['Rest', 'Patellar tendon strap', 'Quadriceps stretching'], redFlags: ['Sudden inability to straighten leg'] },
  { sport: 'Running', bodyPart: 'Knee', category: 'Runner\'s Knee', content: 'Pain around or behind the kneecap, worsened by running downhill.', tags: ['knee', 'ache', 'running'], guidance: ['Reduce mileage', 'Strengthen hips and glutes', 'Check footwear'], redFlags: ['Knee locking or catching', 'Significant swelling'] },
  { sport: 'Running', bodyPart: 'Shin', category: 'Shin Splints', content: 'Pain along inner edge of shinbone from overuse.', tags: ['shin', 'pain', 'running'], guidance: ['Rest, ice, cross-train', 'Calf stretching'], redFlags: ['Focal point of extreme tenderness (possible stress fracture)'] },
  { sport: 'Running', bodyPart: 'Hip', category: 'IT Band Syndrome', content: 'Pain on the outside of the knee or hip, caused by tight iliotibial band.', tags: ['hip', 'knee', 'pain'], guidance: ['Foam rolling IT band', 'Glute strengthening'], redFlags: ['Sharp pain that causes limping'] },
  { sport: 'Tennis', bodyPart: 'Elbow', category: 'Tennis Elbow', content: 'Pain on outside of elbow from repetitive gripping and backhands.', tags: ['elbow', 'pain', 'grip'], guidance: ['Rest, ice, forearm brace', 'Check racket grip size'], redFlags: ['Pain at rest', 'Inability to hold objects'] },
  { sport: 'Tennis', bodyPart: 'Shoulder', category: 'Impingement', content: 'Pinching of rotator cuff tendons during overhead serves.', tags: ['shoulder', 'pain', 'serve'], guidance: ['Rest', 'Physical therapy', 'Serve technique modification'], redFlags: ['Weakness when lifting arm'] },
  { sport: 'Tennis', bodyPart: 'Wrist', category: 'TFCC Tear', content: 'Injury to cartilage on pinky side of wrist, common with heavy topspin.', tags: ['wrist', 'pain', 'clicking'], guidance: ['Wrist splint', 'Avoid aggravating strokes'], redFlags: ['Constant clicking with pain', 'Severe weakness in grip'] },
  { sport: 'General', bodyPart: 'Head', category: 'Concussion', content: 'Concussion is a mild traumatic brain injury caused by a blow or jolt to the head. Symptoms include headache, confusion, dizziness, nausea, and sensitivity to light/noise. It is a serious injury requiring immediate removal from sport.', tags: ['head', 'concussion', 'dizziness', 'headache', 'nausea'], guidance: ['Remove from play immediately', 'Do not return to sport same day', 'Rest in quiet, dark environment', 'Follow Return-to-Sport protocol under medical supervision'], redFlags: ['Loss of consciousness', 'Repeated vomiting', 'Seizure', 'Worsening headache', 'One pupil larger than other', 'Slurred speech'] },
  { sport: 'General', bodyPart: 'Neck', category: 'Cervical Strain', content: 'Whiplash or awkward fall causing neck muscle strain.', tags: ['neck', 'stiffness', 'pain'], guidance: ['Gentle range of motion', 'Ice initially, then heat'], redFlags: ['Numbness, tingling or weakness in arms', 'Pain shooting down arm', 'Difficulty breathing'] },
  { sport: 'General', bodyPart: 'Back', category: 'Muscle Spasm', content: 'Sudden, involuntary contraction of back muscles.', tags: ['back', 'spasm', 'pain'], guidance: ['Rest in comfortable position', 'Heat therapy', 'Gentle stretching when able'], redFlags: ['Loss of bowel or bladder control', 'Numbness in saddle area', 'Severe pain following direct trauma'] },
];

async function seedDB() {
  try {
    console.log('Connecting to MongoDB...', process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/sportverse');
    console.log('Connected.');
    
    console.log('Clearing existing InjuryKnowledge...');
    await InjuryKnowledge.deleteMany({});
    
    console.log('Inserting seed data...');
    const result = await InjuryKnowledge.insertMany(seedData);
    console.log(`Inserted ${result.length} entries successfully.`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding DB:', error);
    process.exit(1);
  }
}

seedDB();
