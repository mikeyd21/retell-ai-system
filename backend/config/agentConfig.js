/**
 * Retell AI Voice Agent Configuration for Plumbing Company Receptionist
 */

const companyName = process.env.COMPANY_NAME || 'ABC Plumbing Services';
const companyPhone = process.env.COMPANY_PHONE || '(555) 123-4567';
const serviceArea = process.env.SERVICE_AREA || 'the greater metro area';

const agentConfig = {
  /**
   * Get the main agent prompt for the plumbing receptionist
   */
  getAgentPrompt() {
    return {
      name: `${companyName} Receptionist`,
      voice: 'jennifer', // Friendly, professional female voice
      language: 'en-US',

      systemPrompt: `You are a friendly and professional receptionist for ${companyName}, a trusted plumbing company serving ${serviceArea}. Your primary role is to:

1. Greet callers warmly and professionally
2. Understand their plumbing needs or emergency
3. Collect necessary information to schedule a service appointment
4. Book appointments in the calendar
5. Provide basic information about our services

PERSONALITY:
- Be warm, empathetic, and professional
- Listen carefully to customer concerns
- Show understanding for plumbing emergencies (they can be stressful!)
- Be efficient but not rushed
- Speak clearly and at a moderate pace

INFORMATION TO COLLECT:
1. Customer's full name
2. Phone number (for callback)
3. Email address (optional, for confirmation)
4. Service address
5. Type of plumbing issue/service needed
6. Urgency level (emergency vs. can be scheduled)
7. Preferred date and time for appointment

SERVICES WE OFFER:
- Emergency plumbing (24/7 for burst pipes, major leaks, sewage backups)
- Drain cleaning and clog removal
- Water heater repair and installation
- Leak detection and repair
- Fixture installation (faucets, toilets, sinks)
- General plumbing maintenance and repairs

BUSINESS HOURS:
- Regular appointments: Monday-Friday, 8 AM - 6 PM
- Saturday: 9 AM - 2 PM
- Emergency service available 24/7

SCRIPT GUIDELINES:
- Opening: "Thank you for calling ${companyName}! This is your virtual assistant. How can I help you today?"
- For emergencies: Express urgency and concern, prioritize getting their address and issue details
- For scheduling: Ask about their preferred date and time, then check availability
- Closing: Confirm all details and provide a confirmation message

IMPORTANT RULES:
- Never provide pricing quotes (say "A technician will provide a detailed quote on-site")
- Never make promises about specific arrival times for non-scheduled calls
- For complex issues, offer to have a specialist call them back
- Always confirm the service address before booking
- If unsure about anything, err on the side of helpful and schedule a callback`,

      functions: [
        {
          name: 'book_appointment',
          description: 'Book a plumbing service appointment in the calendar',
          parameters: {
            type: 'object',
            properties: {
              customerName: {
                type: 'string',
                description: "Customer's full name"
              },
              customerPhone: {
                type: 'string',
                description: "Customer's phone number"
              },
              customerEmail: {
                type: 'string',
                description: "Customer's email address (optional)"
              },
              serviceType: {
                type: 'string',
                enum: ['emergency', 'drain', 'waterHeater', 'leak', 'installation', 'general'],
                description: 'Type of plumbing service needed'
              },
              description: {
                type: 'string',
                description: 'Detailed description of the plumbing issue'
              },
              address: {
                type: 'string',
                description: 'Service address where the plumber should go'
              },
              dateTime: {
                type: 'string',
                format: 'date-time',
                description: 'Preferred appointment date and time in ISO format'
              }
            },
            required: ['customerName', 'customerPhone', 'serviceType', 'address', 'dateTime']
          }
        },
        {
          name: 'check_availability',
          description: 'Check available appointment slots for a specific date',
          parameters: {
            type: 'object',
            properties: {
              date: {
                type: 'string',
                format: 'date',
                description: 'The date to check availability for (YYYY-MM-DD format)'
              }
            },
            required: ['date']
          }
        },
        {
          name: 'get_service_info',
          description: 'Get information about a specific plumbing service',
          parameters: {
            type: 'object',
            properties: {
              serviceType: {
                type: 'string',
                enum: ['emergency', 'drain', 'waterHeater', 'leak', 'installation', 'general'],
                description: 'Type of service to get information about'
              }
            }
          }
        },
        {
          name: 'update_customer_info',
          description: 'Update customer information during the call',
          parameters: {
            type: 'object',
            properties: {
              customerName: { type: 'string' },
              customerPhone: { type: 'string' },
              customerEmail: { type: 'string' },
              address: { type: 'string' },
              serviceType: { type: 'string' },
              issueDescription: { type: 'string' }
            }
          }
        }
      ],

      // Retell-specific settings
      responsiveness: 0.8,           // How quickly to respond (0-1)
      interruptSensitivity: 0.6,     // How sensitive to interruptions
      enableBackchannel: true,        // Enable "uh-huh", "I see" responses
      backchannelFrequency: 0.3,     // How often to use backchannels

      // Voice settings
      voiceSpeed: 1.0,               // Normal speaking speed
      voiceTemperature: 0.7,         // Slight variation for natural speech

      // Conversation settings
      maxCallDuration: 600,          // 10 minute max call duration
      silenceTimeout: 10,            // Seconds of silence before prompting
      endCallPhrases: [
        'goodbye',
        'thank you bye',
        'have a good day',
        'thanks for calling'
      ]
    };
  },

  /**
   * Get emergency-specific prompt additions
   */
  getEmergencyPrompt() {
    return `
EMERGENCY PROTOCOL:
This is an EMERGENCY call. Follow these steps:
1. Stay calm but convey urgency
2. Immediately ask: "What is the emergency and what is your address?"
3. Get their phone number for immediate callback
4. Assure them help is on the way
5. Ask them to describe what they see (water flow, location of leak, etc.)
6. Provide safety advice if applicable (turn off water main, etc.)
7. Let them know a technician will call within 15 minutes
    `;
  },

  /**
   * Get company information
   */
  getCompanyInfo() {
    return {
      name: companyName,
      phone: companyPhone,
      serviceArea: serviceArea,
      businessHours: {
        weekdays: '8:00 AM - 6:00 PM',
        saturday: '9:00 AM - 2:00 PM',
        sunday: 'Emergency only',
        emergency: '24/7'
      }
    };
  }
};

module.exports = agentConfig;
