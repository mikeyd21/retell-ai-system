const { google } = require('googleapis');

class GoogleCalendarService {
  constructor() {
    this.oauth2Client = null;
    this.calendar = null;
    this.tokens = null;
  }

  /**
   * Initialize OAuth2 client with credentials
   */
  initialize() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    if (this.tokens) {
      this.oauth2Client.setCredentials(this.tokens);
      this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
    }
  }

  /**
   * Generate OAuth2 authorization URL
   */
  getAuthUrl() {
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokensFromCode(code) {
    const { tokens } = await this.oauth2Client.getToken(code);
    this.tokens = tokens;
    this.oauth2Client.setCredentials(tokens);
    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
    return tokens;
  }

  /**
   * Set tokens directly (for stored tokens)
   */
  setTokens(tokens) {
    this.tokens = tokens;
    this.oauth2Client.setCredentials(tokens);
    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
  }

  /**
   * Book an appointment for a plumbing service call
   * @param {Object} bookingDetails - The booking details
   * @param {string} bookingDetails.customerName - Customer's name
   * @param {string} bookingDetails.customerPhone - Customer's phone number
   * @param {string} bookingDetails.customerEmail - Customer's email (optional)
   * @param {string} bookingDetails.serviceType - Type of plumbing service needed
   * @param {string} bookingDetails.description - Description of the issue
   * @param {string} bookingDetails.address - Service address
   * @param {Date} bookingDetails.startTime - Appointment start time
   * @param {number} bookingDetails.durationMinutes - Duration in minutes (default 60)
   */
  async bookAppointment(bookingDetails) {
    if (!this.calendar) {
      throw new Error('Google Calendar not initialized. Please authenticate first.');
    }

    const {
      customerName,
      customerPhone,
      customerEmail,
      serviceType,
      description,
      address,
      startTime,
      durationMinutes = 60
    } = bookingDetails;

    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + durationMinutes);

    const event = {
      summary: `Plumbing Service: ${serviceType} - ${customerName}`,
      location: address,
      description: `
Customer: ${customerName}
Phone: ${customerPhone}
${customerEmail ? `Email: ${customerEmail}` : ''}

Service Type: ${serviceType}
Issue Description: ${description}

Address: ${address}

--- Booked via AI Receptionist ---
      `.trim(),
      start: {
        dateTime: startTime.toISOString(),
        timeZone: 'America/New_York'
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: 'America/New_York'
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 24 hours before
          { method: 'popup', minutes: 60 } // 1 hour before
        ]
      }
    };

    // Add attendee if email provided
    if (customerEmail) {
      event.attendees = [{ email: customerEmail }];
    }

    const response = await this.calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
      resource: event,
      sendUpdates: customerEmail ? 'all' : 'none'
    });

    return {
      eventId: response.data.id,
      htmlLink: response.data.htmlLink,
      start: response.data.start,
      end: response.data.end,
      summary: response.data.summary
    };
  }

  /**
   * Get available time slots for a given date
   * @param {Date} date - The date to check availability
   * @param {number} slotDurationMinutes - Duration of each slot (default 60)
   */
  async getAvailableSlots(date, slotDurationMinutes = 60) {
    if (!this.calendar) {
      throw new Error('Google Calendar not initialized. Please authenticate first.');
    }

    // Business hours: 8 AM to 6 PM
    const businessStart = 8;
    const businessEnd = 18;

    const startOfDay = new Date(date);
    startOfDay.setHours(businessStart, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(businessEnd, 0, 0, 0);

    // Get existing events for the day
    const response = await this.calendar.events.list({
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      singleEvents: true,
      orderBy: 'startTime'
    });

    const existingEvents = response.data.items || [];

    // Generate all possible slots
    const allSlots = [];
    let currentSlot = new Date(startOfDay);

    while (currentSlot < endOfDay) {
      const slotEnd = new Date(currentSlot);
      slotEnd.setMinutes(slotEnd.getMinutes() + slotDurationMinutes);

      if (slotEnd <= endOfDay) {
        allSlots.push({
          start: new Date(currentSlot),
          end: new Date(slotEnd)
        });
      }

      currentSlot.setMinutes(currentSlot.getMinutes() + slotDurationMinutes);
    }

    // Filter out slots that conflict with existing events
    const availableSlots = allSlots.filter(slot => {
      return !existingEvents.some(event => {
        const eventStart = new Date(event.start.dateTime || event.start.date);
        const eventEnd = new Date(event.end.dateTime || event.end.date);

        // Check for overlap
        return (slot.start < eventEnd && slot.end > eventStart);
      });
    });

    return availableSlots.map(slot => ({
      start: slot.start.toISOString(),
      end: slot.end.toISOString(),
      display: slot.start.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    }));
  }

  /**
   * Check if the service is authenticated
   */
  isAuthenticated() {
    return this.tokens !== null && this.calendar !== null;
  }
}

// Singleton instance
const calendarService = new GoogleCalendarService();
calendarService.initialize();

module.exports = calendarService;
