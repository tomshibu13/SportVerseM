const InjuryReport = require('../models/InjuryReport');
const { classifyRisk } = require('../utils/safetyEngine');
const { searchKnowledgeBase } = require('../utils/vectorRagService');
const { generateInjuryAssessment } = require('../utils/geminiClient');
const { generateGroundedInjuryResponse, MANDATORY_DISCLAIMER } = require('../utils/ragGenerator');
const { checkMedicationSafety } = require('../utils/medicationSafetyService');

/**
 * Assess Injury Full Form Pipeline:
 * 1. Input validation
 * 2. Medication safety gate (stops pipeline if medication query)
 * 3. Red-flag safety engine (determines riskLevel & checks for URGENT)
 * 4. Vector RAG retrieval (fetches sports medicine chunks & source metadata)
 * 5. Gemini generation (grounded in RAG, cannot override safety/medication rules)
 * 6. Response validation & persistence
 */
exports.assessInjury = async (req, res) => {
  const startTime = Date.now();
  try {
    const { sport, bodyPart, injuryMechanism, symptoms, painLevel, mobilityStatus, hasSwelling, hasPreviousInjury, painDurationDays, imageBase64 } = req.body;
    const userId = req.user?.userId || req.user?._id || 'guest_user_123';

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
        disclaimer: MANDATORY_DISCLAIMER,
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

    // 4. Vector RAG Retrieval with source tracking
    const searchQuery = `${sport} ${bodyPart} ${injuryMechanism} ${(Array.isArray(symptoms) ? symptoms : [symptoms]).join(' ')}`;
    const ragResult = await searchKnowledgeBase({
      query: searchQuery,
      sport,
      bodyPart,
      topK: 3,
      similarityThreshold: 0.40
    });

    // 5. Gemini Generation with structured output validation
    const aiResult = await generateInjuryAssessment({
      assessmentData,
      ragContext: ragResult.formattedText,
      safetyClassification,
      sources: ragResult.sources
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
      sources: ragResult.sources,
      disclaimer: MANDATORY_DISCLAIMER,
      isGeminiUsed: !aiResult.isFallback,
      geminiError: aiResult.geminiError || ''
    });

    await report.save();

    const reportData = report.toObject();
    reportData.id = report._id.toString();
    reportData.isFallback = aiResult.isFallback || false;
    reportData.sources = ragResult.sources;

    console.log(`[Assessment Complete] risk=${finalRiskLevel} responseType=${reportData.responseType} sourcesCount=${ragResult.sources.length} latency=${Date.now() - startTime}ms`);

    res.status(201).json({
      success: true,
      report: reportData
    });

  } catch (error) {
    console.error('[Assess Injury Error]:', error);
    res.status(500).json({ success: false, message: 'Server error during assessment' });
  }
};

/**
 * Dedicated AI Sports Injury Assistant Endpoint
 * POST /api/ai/injury-assistant
 * 
 * Standard Request:
 * {
 *   "message": "My knee hurts after playing football",
 *   "conversationId": "conv_123",
 *   "history": []
 * }
 * 
 * Standard Response:
 * {
 *   "success": true,
 *   "answer": "...",
 *   "reply": "...",
 *   "sources": [ ... ],
 *   "disclaimer": "...",
 *   "retrieved": true,
 *   "riskLevel": "MODERATE",
 *   "responseType": "NORMAL"
 * }
 */
exports.injuryAssistantEndpoint = async (req, res) => {
  const startTime = Date.now();
  try {
    const { message, conversationId, history = [], sport = '', bodyPart = '' } = req.body;
    const userMsg = (message || '').trim();

    if (!userMsg) {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
        answer: 'Please provide a message describing your injury or symptoms.',
        sources: [],
        disclaimer: MANDATORY_DISCLAIMER,
        retrieved: false
      });
    }

    // Extract user-only text for safety triage to avoid false alarms from prior AI warnings
    const userOnlyHistory = Array.isArray(history)
      ? history
          .filter(h => h.sender === 'user' || h.role === 'user')
          .map(h => (h.text || h.content || ''))
          .join(' ')
      : '';
    const userContextText = `${userOnlyHistory} ${userMsg}`.toLowerCase();

    // 1. Medication Safety Gate (Deterministic refusal before RAG)
    const medCheck = checkMedicationSafety(userMsg, history);
    if (medCheck.isMedicationRequest) {
      console.log(`[Injury Assistant Gate]: Medication request detected -> Safe refusal (${Date.now() - startTime}ms)`);
      return res.json({
        success: true,
        answer: medCheck.refusalResponse.reply,
        reply: medCheck.refusalResponse.reply,
        sources: [],
        disclaimer: MANDATORY_DISCLAIMER,
        retrieved: false,
        riskLevel: 'LOW',
        responseType: 'MEDICATION_REFUSAL',
        conversationId: conversationId || `conv_${Date.now()}`,
        suggested_actions: medCheck.refusalResponse.suggested_actions
      });
    }

    // 2. Deterministic Red-Flag Emergency Triage (Evaluating USER symptoms only)
    const inferredPainLevel = userMsg.toLowerCase().includes('severe') || userMsg.toLowerCase().includes('8') || userMsg.toLowerCase().includes('9') || userMsg.toLowerCase().includes('10') || userMsg.toLowerCase().includes('cannot walk') ? 8 : (userMsg.toLowerCase().includes('mild') || userMsg.toLowerCase().includes('1') || userMsg.toLowerCase().includes('2') || userMsg.toLowerCase().includes('3') ? 3 : 5);

    const safetyResult = classifyRisk({
      symptoms: [userMsg],
      painLevel: inferredPainLevel,
      bodyPart: bodyPart || (userContextText.includes('ankle') ? 'Ankle' : (userContextText.includes('knee') ? 'Knee' : (userContextText.includes('shoulder') ? 'Shoulder' : (userContextText.includes('hamstring') ? 'Hamstring' : (userContextText.includes('head') ? 'Head' : 'General'))))),
      injuryMechanism: userContextText.includes('twist') ? 'Twisting' : (userContextText.includes('fall') ? 'Fall' : 'Direct Impact'),
      hasSwelling: userContextText.includes('swell') || userContextText.includes('swelling'),
      mobilityStatus: userContextText.includes("can't walk") || userContextText.includes("cannot bear weight") || userContextText.includes("can't move") ? 'None' : (userContextText.includes('limp') || userContextText.includes('hard to walk') ? 'Partial' : 'Full'),
      sport: sport || 'Sports',
      text: userMsg
    });

    if (safetyResult.riskLevel === 'URGENT') {
      console.log(`[Injury Assistant Safety]: URGENT red flags detected: ${safetyResult.redFlags.join(', ')}`);
      const urgentReply = `🚨 **EMERGENCY MEDICAL WARNING**\n\n` +
        `Critical red-flag symptoms have been detected:\n` +
        `${safetyResult.redFlags.map(rf => `• ${rf}`).join('\n')}\n\n` +
        `**Immediate Required Actions:**\n` +
        `• **Seek emergency medical care immediately** (call emergency services or visit the nearest Emergency Room).\n` +
        `• Do NOT attempt to move if head, neck, or spine trauma is suspected.\n` +
        `• Do NOT attempt to bear weight or realign any deformed limb or joint.\n` +
        `• Keep the injured person calm, warm, and monitored until medical professionals arrive.`;

      return res.json({
        success: true,
        answer: urgentReply,
        reply: urgentReply,
        sources: [],
        disclaimer: MANDATORY_DISCLAIMER,
        retrieved: false,
        riskLevel: 'URGENT',
        responseType: 'URGENT_SAFETY',
        conversationId: conversationId || `conv_${Date.now()}`,
        suggested_actions: ['🚨 Call Emergency (112 / 911)', 'Find nearest hospital', 'Emergency first aid steps']
      });
    }

    // 3. Vector RAG Search over indexed sports-medicine PDFs
    const ragResult = await searchKnowledgeBase({
      query: userMsg,
      history: history,
      sport: sport,
      bodyPart: bodyPart,
      topK: 3,
      similarityThreshold: 0.45
    });

    // 4. Grounded Response Generation with LLM
    const responseResult = await generateGroundedInjuryResponse({
      userMessage: userMsg,
      ragContext: ragResult.formattedText,
      sources: ragResult.sources,
      noKnowledgeFound: ragResult.noKnowledgeFound,
      riskLevel: safetyResult.riskLevel,
      history: history
    });

    // Suggested contextual actions
    const suggestedActions = safetyResult.riskLevel === 'HIGH'
      ? ['How to ice properly?', 'Severe pain signs', 'Cannot bear weight', 'RICE protocol steps']
      : (ragResult.sources.length > 0
        ? ['RICE protocol steps', 'When can I play again?', 'When to see a doctor?', 'Show injury prevention']
        : ['Ask about ankle sprains', 'Ask about knee pain', 'Ask about hamstring strains', '🩺 Take full assessment']);

    console.log(`[Injury Assistant Complete]: Retrieved=${responseResult.retrieved} Sources=${responseResult.sources.length} Risk=${safetyResult.riskLevel} (${Date.now() - startTime}ms)`);

    return res.json({
      success: true,
      answer: responseResult.answer,
      reply: responseResult.answer,
      sources: responseResult.sources,
      disclaimer: responseResult.disclaimer,
      retrieved: responseResult.retrieved,
      riskLevel: safetyResult.riskLevel,
      responseType: safetyResult.responseType || 'NORMAL',
      conversationId: conversationId || `conv_${Date.now()}`,
      suggested_actions: suggestedActions
    });

  } catch (error) {
    console.error('[Injury Assistant Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during injury assessment',
      answer: 'An unexpected server error occurred while retrieving sports-injury guidance. Please try again.',
      reply: 'An unexpected server error occurred while retrieving sports-injury guidance. Please try again.',
      sources: [],
      disclaimer: MANDATORY_DISCLAIMER,
      retrieved: false,
      riskLevel: null
    });
  }
};

/**
 * Multi-Turn Follow-Up Chat on an existing Injury Assessment Report
 */
exports.injuryFollowUpChat = async (req, res) => {
  try {
    const report = await InjuryReport.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

    const { message } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'Message is required' });

    // Check Medication Safety Gate
    const medCheck = checkMedicationSafety(message, report.chatHistory);
    if (medCheck.isMedicationRequest) {
      report.chatHistory.push({ role: 'user', content: message, timestamp: new Date() });
      report.chatHistory.push({ role: 'assistant', content: medCheck.refusalResponse.reply, timestamp: new Date() });
      await report.save();

      return res.json({
        success: true,
        chatHistory: report.chatHistory,
        responseType: 'MEDICATION_REFUSAL',
        riskLevel: report.riskLevel,
        reply: medCheck.refusalResponse.reply,
        sources: [],
        disclaimer: MANDATORY_DISCLAIMER
      });
    }

    report.chatHistory.push({ role: 'user', content: message, timestamp: new Date() });

    // 1. Contextual RAG search using report context (bodyPart, sport) + user follow-up
    const ragResult = await searchKnowledgeBase({
      query: `${message} (Injury: ${report.bodyPart}, Sport: ${report.sport})`,
      history: report.chatHistory,
      sport: report.sport,
      bodyPart: report.bodyPart,
      topK: 3,
      similarityThreshold: 0.40
    });

    // 2. Generate Grounded AI Response
    const aiResult = await generateGroundedInjuryResponse({
      userMessage: message,
      ragContext: ragResult.formattedText,
      sources: ragResult.sources,
      noKnowledgeFound: ragResult.noKnowledgeFound,
      riskLevel: report.riskLevel,
      history: report.chatHistory
    });

    report.chatHistory.push({ role: 'assistant', content: aiResult.answer, timestamp: new Date() });
    await report.save();

    res.json({
      success: true,
      chatHistory: report.chatHistory,
      reply: aiResult.answer,
      sources: aiResult.sources,
      riskLevel: report.riskLevel,
      responseType: 'NORMAL',
      disclaimer: aiResult.disclaimer
    });
  } catch (error) {
    console.error('[Follow-up Chat Error]:', error);
    res.status(500).json({ success: false, message: 'Server error during follow-up chat' });
  }
};

exports.getInjuryHistory = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?._id || 'guest_user_123';
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

exports.addRecoveryCheckIn = async (req, res) => {
  try {
    const report = await InjuryReport.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

    const { painLevel, mobilityStatus, notes } = req.body;
    report.checkIns.push({ painLevel, mobilityStatus, notes, date: new Date() });
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
