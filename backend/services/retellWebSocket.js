const calendarService = require('./googleCalendar');
const agentConfig = require('../config/agentConfig');

/**
 * Handle Retell AI WebSocket connections for real-time voice interactions
 */
function handleRetellWebSocket(ws, req) {
  console.log('Retell WebSocket connection established');

  // Store conversation context
  let conversationContext = {
    customerName: null,
    customerPhone: null,
    customerEmail: null,
    serviceType: null,
    issueDescription: null,
    address: null,
    preferredDate: null,
    preferredTime: null,
    bookingConfirmed: false
  };

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('Received message:', message.type);

      switch (message.type) {
        case 'call_started':
          handleCallStarted(ws, message);
          break;

        case 'call_ended':
          handleCallEnded(ws, message, conversationContext);
          break;

        case 'transcript':
          await handleTranscript(ws, message, conversationContext);
          break;

        case 'function_call':
          await handleFunctionCall(ws, message, conversationContext);
          break;

        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: error.message
      }));
    }
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
}

/**
 * Handle call started event
 */
function handleCallStarted(ws, message) {
  console.log('Call started:', message.call_id);

  // Send initial agent configuration
  ws.send(JSON.stringify({
    type: 'config',
    agent: agentConfig.getAgentPrompt()
  }));
}

/**
 * Handle call ended event
 */
function handleCallEnded(ws, message, context) {
  console.log('Call ended:', message.call_id);
  console.log('Final conversation context:', context);

  // Log call summary for analytics
  if (context.bookingConfirmed) {
    console.log(`Booking confirmed for ${context.customerName}`);
  }
}

/**
 * Handle transcript updates
 */
async function handleTranscript(ws, message, context) {
  const { transcript, speaker } = message;

  // Extract information from customer speech
  if (speaker === 'customer') {
    extractCustomerInfo(transcript, context);
  }
}

/**
 * Handle function calls from Retell AI
 */
async function handleFunctionCall(ws, message, context) {
  const { function_name, arguments: args } = message;
  let result;

  try {
    switch (function_name) {
      case 'book_appointment':
        result = await bookAppointment(args, context);
        break;

      case 'check_availability':
        result = await checkAvailability(args);
        break;

      case 'get_service_info':
        result = getServiceInfo(args);
        break;

      case 'update_customer_info':
        updateCustomerInfo(args, context);
        result = { success: true, message: 'Customer information updated' };
        break;

      default:
        result = { error: `Unknown function: ${function_name}` };
    }

    ws.send(JSON.stringify({
      type: 'function_call_result',
      function_name,
      result
    }));
  } catch (error) {
    console.error(`Error executing function ${function_name}:`, error);
    ws.send(JSON.stringify({
      type: 'function_call_result',
      function_name,
      result: { error: error.message }
    }));
  }
}

/**
 * Book an appointment via Google Calendar
 */
async function bookAppointment(args, context) {
  const {
    customerName,
    customerPhone,
    customerEmail,
    serviceType,
    description,
    address,
    dateTime
  } = args;

  // Update context
  context.customerName = customerName || context.customerName;
  context.customerPhone = customerPhone || context.customerPhone;
  context.customerEmail = customerEmail || context.customerEmail;
  context.serviceType = serviceType || context.serviceType;
  context.issueDescription = description || context.issueDescription;
  context.address = address || context.address;

  if (!calendarService.isAuthenticated()) {
    return {
      success: false,
      message: 'Calendar service not configured. Please have the office call you back to confirm your appointment.'
    };
  }

  try {
    const booking = await calendarService.bookAppointment({
      customerName: context.customerName,
      customerPhone: context.customerPhone,
      customerEmail: context.customerEmail,
      serviceType: context.serviceType,
      description: context.issueDescription,
      address: context.address,
      startTime: new Date(dateTime)
    });

    context.bookingConfirmed = true;

    return {
      success: true,
      message: `Appointment booked for ${new Date(dateTime).toLocaleString()}`,
      eventId: booking.eventId
    };
  } catch (error) {
    console.error('Error booking appointment:', error);
    return {
      success: false,
      message: 'Unable to book appointment at this time. Our team will call you back to confirm.'
    };
  }
}

/**
 * Check calendar availability
 */
async function checkAvailability(args) {
  const { date } = args;

  if (!calendarService.isAuthenticated()) {
    return {
      success: false,
      message: 'Calendar service not configured.',
      slots: getDefaultSlots()
    };
  }

  try {
    const slots = await calendarService.getAvailableSlots(new Date(date));
    return {
      success: true,
      date,
      availableSlots: slots
    };
  } catch (error) {
    console.error('Error checking availability:', error);
    return {
      success: false,
      message: 'Unable to check availability',
      slots: getDefaultSlots()
    };
  }
}

/**
 * Get default time slots when calendar is not available
 */
function getDefaultSlots() {
  return [
    { display: '8:00 AM' },
    { display: '9:00 AM' },
    { display: '10:00 AM' },
    { display: '11:00 AM' },
    { display: '1:00 PM' },
    { display: '2:00 PM' },
    { display: '3:00 PM' },
    { display: '4:00 PM' }
  ];
}

/**
 * Get information about services offered
 */
function getServiceInfo(args) {
  const services = {
    emergency: {
      name: 'Emergency Plumbing',
      description: '24/7 emergency service for burst pipes, major leaks, and sewage backups',
      estimatedTime: '1-2 hours response time'
    },
    drain: {
      name: 'Drain Cleaning',
      description: 'Professional drain cleaning and clog removal',
      estimatedTime: '1 hour service call'
    },
    waterHeater: {
      name: 'Water Heater Services',
      description: 'Repair, replacement, and installation of water heaters',
      estimatedTime: '2-4 hours depending on service'
    },
    leak: {
      name: 'Leak Detection & Repair',
      description: 'Finding and fixing hidden leaks in your plumbing system',
      estimatedTime: '1-2 hours'
    },
    installation: {
      name: 'Fixture Installation',
      description: 'Installation of faucets, toilets, sinks, and other fixtures',
      estimatedTime: '1-3 hours depending on fixture'
    },
    general: {
      name: 'General Plumbing',
      description: 'General plumbing maintenance and repairs',
      estimatedTime: '1-2 hours'
    }
  };

  if (args.serviceType && services[args.serviceType]) {
    return services[args.serviceType];
  }

  return {
    availableServices: Object.keys(services),
    services
  };
}

/**
 * Update customer information in context
 */
function updateCustomerInfo(args, context) {
  Object.keys(args).forEach(key => {
    if (context.hasOwnProperty(key)) {
      context[key] = args[key];
    }
  });
}

/**
 * Extract customer information from transcript
 */
function extractCustomerInfo(transcript, context) {
  // Phone number pattern
  const phoneMatch = transcript.match(/(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/);
  if (phoneMatch) {
    context.customerPhone = phoneMatch[1];
  }

  // Email pattern
  const emailMatch = transcript.match(/[\w.-]+@[\w.-]+\.\w+/);
  if (emailMatch) {
    context.customerEmail = emailMatch[0];
  }
}

module.exports = { handleRetellWebSocket };
