const express = require('express');
const router = express.Router();
const Retell = require('retell-sdk');
const agentConfig = require('../config/agentConfig');

// Initialize Retell client
const retellClient = new Retell({
  apiKey: process.env.RETELL_API_KEY || ''
});

/**
 * POST /api/retell/webhook
 * Main webhook endpoint for Retell AI events
 */
router.post('/webhook', async (req, res) => {
  try {
    const event = req.body;
    console.log('Retell webhook event:', event.event_type);

    switch (event.event_type) {
      case 'call_started':
        console.log('Call started:', event.call_id);
        break;

      case 'call_ended':
        console.log('Call ended:', event.call_id);
        // Log call analytics
        logCallAnalytics(event);
        break;

      case 'call_analyzed':
        console.log('Call analyzed:', event.call_id);
        break;

      default:
        console.log('Unknown event type:', event.event_type);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * POST /api/retell/create-call
 * Create an outbound call
 */
router.post('/create-call', async (req, res) => {
  try {
    const { phoneNumber, agentId } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const call = await retellClient.call.createPhoneCall({
      from_number: process.env.RETELL_PHONE_NUMBER,
      to_number: phoneNumber,
      agent_id: agentId || process.env.RETELL_AGENT_ID
    });

    res.json({
      success: true,
      callId: call.call_id,
      status: call.call_status
    });
  } catch (error) {
    console.error('Error creating call:', error);
    res.status(500).json({ error: 'Failed to create call' });
  }
});

/**
 * POST /api/retell/create-web-call
 * Create a web-based call (for testing in browser)
 */
router.post('/create-web-call', async (req, res) => {
  try {
    const webCall = await retellClient.call.createWebCall({
      agent_id: process.env.RETELL_AGENT_ID
    });

    res.json({
      success: true,
      callId: webCall.call_id,
      accessToken: webCall.access_token
    });
  } catch (error) {
    console.error('Error creating web call:', error);
    res.status(500).json({ error: 'Failed to create web call' });
  }
});

/**
 * GET /api/retell/call/:callId
 * Get call details
 */
router.get('/call/:callId', async (req, res) => {
  try {
    const call = await retellClient.call.retrieve(req.params.callId);
    res.json(call);
  } catch (error) {
    console.error('Error retrieving call:', error);
    res.status(500).json({ error: 'Failed to retrieve call' });
  }
});

/**
 * GET /api/retell/agent-config
 * Get the agent configuration (for dashboard)
 */
router.get('/agent-config', (req, res) => {
  res.json(agentConfig.getAgentPrompt());
});

/**
 * GET /api/retell/company-info
 * Get company information
 */
router.get('/company-info', (req, res) => {
  res.json(agentConfig.getCompanyInfo());
});

/**
 * POST /api/retell/register-agent
 * Register or update the agent with Retell
 */
router.post('/register-agent', async (req, res) => {
  try {
    const config = agentConfig.getAgentPrompt();

    // Create or update agent in Retell
    const agent = await retellClient.agent.create({
      agent_name: config.name,
      voice_id: config.voice,
      language: config.language,
      response_engine: {
        type: 'retell-llm',
        llm_id: process.env.RETELL_LLM_ID
      },
      webhook_url: process.env.WEBHOOK_URL
    });

    res.json({
      success: true,
      agentId: agent.agent_id,
      message: 'Agent registered successfully'
    });
  } catch (error) {
    console.error('Error registering agent:', error);
    res.status(500).json({ error: 'Failed to register agent' });
  }
});

/**
 * Log call analytics
 */
function logCallAnalytics(event) {
  const analytics = {
    callId: event.call_id,
    duration: event.duration_seconds,
    endedBy: event.ended_by,
    disconnectionReason: event.disconnection_reason,
    timestamp: new Date().toISOString()
  };

  console.log('Call Analytics:', JSON.stringify(analytics, null, 2));
  // In production, you would save this to a database
}

module.exports = router;
