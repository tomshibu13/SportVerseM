const InjuryReport = require('../models/InjuryReport');
const { classifyRisk } = require('../utils/safetyEngine');
const { retrieveRelevantKnowledge } = require('../utils/injuryRag');
const { generateInjuryAssessment } = require('../utils/geminiClient');
const { checkMedicationSafety } = require('../utils/medicationSafetyService');
const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Assess Injury Pipeline:
 * 1. Input validation
 * 2. Medication safety gate (stops pipeline if medication query)
 * 3. Red-flag safety engine (determines riskLevel & checks for URGENT)
 * 4. RAG retrieval (fetches sports medicine chunks & source metadata)
 * 5. Gemini generation (grounded in RAG, cannot override safety/medication rules)
 * 6. Response validation & persistence
 */
exports.assessInjury = async (req, res) => {
  const startTime = Date.now();
  try {
    const { sport, bodyPart, injuryMechanism, symptoms, painLevel, mobilityStatus, hasSwelling, hasPreviousInjury, painDurationDays, imageBase64 } = req.body;
    const userId = req.user?.userId || 'guest_user_123';

    // 1. Input validation
    if (!sport || !bodyPart || !injuryMechanism || !symptoms || painLevel === undefined || !mobilityStatus) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const allInputText = [sport, bodyPart, injuryMechanism, ...(Array.isArray(symptoms) ? symptoms : [symptoms])].join(' ');

    // 2. Medication Safety Gate (Runs BEFORE RAG and BEFORE Gemini)
    const medCheck = checkMedicationSafety(allInputText);
    if (medCheck.isMedicationRequest) {
      console.log(`[Safety Gate Triggered]: Medication inquiry detected in assessment. Latency: ${Date.now() - startTime}ms`);
      return res.status(200).json({
        success: true,
        report: {
          ...medCheck.refusalResponse,
          sport,
          bodyPart,
          injuryMechanism,
          symptoms: Array.isArray(symptoms) ? symptoms : [symptoms],
          painLevel,
          mobilityStatus,
          hasSwelling,
          createdAt: new Date().toISOString()
        }
      });
    }

    const assessmentData = { sport, bodyPart, injuryMechanism, symptoms, painLevel, mobilityStatus, hasSwelling, hasPreviousInjury, painDurationDays };
    
    // 3. Red-Flag Safety Engine (Deterministic classification)
    const safetyClassification = classifyRisk(assessmentData);

    // If URGENT red flags detected, return urgent safety guidance immediately
    if (safetyClassification.riskLevel === 'URGENT') {
      console.log(`[Safety Engine Triggered]: URGENT red flags detected: ${safetyClassification.redFlags.join(', ')}`);
      const urgentReport = new InjuryReport({
        userId,
        sport,
        bodyPart,
        injuryMechanism,
        symptoms,
        painLevel,
        hasSwelling,
        mobilityStatus,
        hasPreviousInjury,
        painDurationDays,
        imageBase64,
        riskLevel: 'URGENT',
        responseType: 'URGENT_SAFETY',
        possibleCategories: ['URGENT: Emergency Trauma / Medical Attention Required'],
        generalGuidance: safetyClassification.urgentGuidance || [
          'SEEK EMERGENCY MEDICAL CARE IMMEDIATELY',
          'Do not move the injured area or attempt to bear weight',
          'Immobilize the joint/limb and wait for professional medical assistance'
        ],
        thingsToAvoid: [
          'Attempting to walk, run, or continue any physical activity',
          'Attempting to pop, reduce, or realign a dislocated joint or suspected fracture',
          'Delaying emergency hospital/clinic evaluation'
        ],
        warningSigns: safetyClassification.redFlags,
        professionalCareRecommended: true,
        followUpQuestions: ['Are emergency medical responders on the way?'],
        aiSummary: 'CRITICAL WARNING: Red flags indicate high potential for serious injury. Emergency evaluation is required.',
        disclaimer: 'SportVerse AI provides general sports-health information and does not provide medical diagnosis or personalized medication advice.',
        isGeminiUsed: false
      });

      await urgentReport.save();

      return res.status(201).json({
        success: true,
        report: {
          ...urgentReport.toObject(),
          id: urgentReport._id.toString()
        }
      });
    }

    // 4. RAG Retrieval with source tracking
    const { formattedText: ragContext, sources } = await retrieveRelevantKnowledge({
      sport,
      bodyPart,
      symptoms: Array.isArray(symptoms) ? symptoms : [symptoms]
    });
    
    // 5. Gemini Generation with structured output validation
    const aiResult = await generateInjuryAssessment({
      assessmentData,
      ragContext,
      safetyClassification,
      sources
    });

    // 6. Enforce Safety Level (Gemini CANNOT downgrade HIGH or URGENT)
    let finalRiskLevel = aiResult.riskLevel || 'LOW';
    if (safetyClassification.riskLevel === 'HIGH' || safetyClassification.riskLevel === 'URGENT') {
      finalRiskLevel = safetyClassification.riskLevel;
    } else if (safetyClassification.riskLevel === 'MODERATE' && finalRiskLevel === 'LOW') {
      finalRiskLevel = 'MODERATE';
    }

    const report = new InjuryReport({
      userId,
      sport,
      bodyPart,
      injuryMechanism,
      symptoms,
      painLevel,
      hasSwelling,
      mobilityStatus,
      hasPreviousInjury,
      painDurationDays,
      imageBase64,
      riskLevel: finalRiskLevel,
      responseType: aiResult.responseType || 'NORMAL',
      possibleCategories: aiResult.possibleCategories,
      generalGuidance: aiResult.generalGuidance,
      thingsToAvoid: aiResult.thingsToAvoid,
      warningSigns: aiResult.warningSigns,
      professionalCareRecommended: aiResult.professionalCareRecommended || safetyClassification.professionalCareRecommended,
      followUpQuestions: aiResult.followUpQuestions,
      aiSummary: aiResult.aiSummary,
      sources: sources,
      disclaimer: 'SportVerse AI provides general sports-health information and does not provide medical diagnosis or personalized medication advice.',
      isGeminiUsed: !aiResult.isFallback,
      geminiError: aiResult.geminiError || ''
    });

    await report.save();

    const reportData = report.toObject();
    reportData.id = report._id.toString();
    reportData.isFallback = aiResult.isFallback || false;
    reportData.sources = sources;

    console.log(`[Assessment Complete] risk=${finalRiskLevel} responseType=${reportData.responseType} sourcesCount=${sources.length} latency=${Date.now() - startTime}ms`);

    res.status(201).json({
      success: true,
      report: reportData
    });

  } catch (error) {
    console.error('[Assess Injury Error]:', error);
    res.status(500).json({ success: false, message: 'Server error during assessment' });
  }
};

exports.getInjuryHistory = async (req, res) => {
  try {
    const userId = req.user?.userId || 'guest_user_123';
    const reports = await InjuryReport.find({ userId }).sort({ createdAt: -1 }).limit(20);
    res.json({ success: true, reports });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve history' });
  }
};

exports.getInjuryReport = async (req, res) => {
  try {
    const report = await InjuryReport.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
    res.json({ success: true, report: report.toObject() });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.injuryFollowUpChat = async (req, res) => {
  try {
    const report = await InjuryReport.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

    const { message } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'Message is required' });

    // Check Medication Safety Gate
    const medCheck = checkMedicationSafety(message, report.chatHistory);
    if (medCheck.isMedicationRequest) {
      report.chatHistory.push({ role: 'user', content: message });
      report.chatHistory.push({ role: 'assistant', content: medCheck.refusalResponse.reply });
      await report.save();

      return res.json({
        success: true,
        chatHistory: report.chatHistory,
        responseType: 'MEDICATION_REFUSAL',
        riskLevel: report.riskLevel,
        reply: medCheck.refusalResponse.reply
      });
    }

    report.chatHistory.push({ role: 'user', content: message });
    
    let assistantResponse = "Please remember to rest, apply cold compression wrapped in a cloth, and elevate the injured area. For medication or clinical advice, consult a qualified healthcare professional.";
    
    if (process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('your_')) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
          model: 'gemini-3.5-flash',
          systemInstruction: `You are SportVerse AI sports-medicine educational assistant.
STRICT SAFETY RULES:
1. NEVER prescribe medication, recommend specific drugs, or provide dosage/frequency schedules.
2. NEVER diagnose an injury.
3. For medical or medication advice, recommend consulting a doctor or pharmacist.
4. Keep advice centered on non-medicinal RICE protocol, rest, and when to seek medical evaluation.`
        });
        const chat = model.startChat({
          history: report.chatHistory.slice(0, -1).map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }))
        });
        const result = await chat.sendMessage(`Context: Ongoing report for ${report.bodyPart} (${report.sport}). Risk: ${report.riskLevel}. User message: ${message}`);
        assistantResponse = result.response.text();
      } catch (e) {
         console.error('Gemini chat error:', e.message);
      }
    }

    report.chatHistory.push({ role: 'assistant', content: assistantResponse });
    await report.save();

    res.json({
      success: true,
      chatHistory: report.chatHistory,
      reply: assistantResponse,
      riskLevel: report.riskLevel,
      responseType: 'NORMAL'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.addRecoveryCheckIn = async (req, res) => {
  try {
    const report = await InjuryReport.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

    const { painLevel, mobilityStatus, notes } = req.body;
    report.checkIns.push({ painLevel, mobilityStatus, notes });
    await report.save();

    res.json({ success: true, checkIns: report.checkIns });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getPainProgressChart = async (req, res) => {
  try {
    const report = await InjuryReport.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

    const chartData = report.checkIns.map(c => ({ date: c.date, painLevel: c.painLevel, mobilityStatus: c.mobilityStatus }));
    res.json({ success: true, chartData });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.deleteInjuryReport = async (req, res) => {
  try {
    const report = await InjuryReport.findByIdAndDelete(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
    res.json({ success: true, message: 'Report deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
