const express = require('express');
const router = express.Router();
const calendarService = require('../services/googleCalendar');

/**
 * GET /api/calendar/auth
 * Get Google OAuth authorization URL
 */
router.get('/auth', (req, res) => {
  try {
    const authUrl = calendarService.getAuthUrl();
    res.json({ authUrl });
  } catch (error) {
    console.error('Error getting auth URL:', error);
    res.status(500).json({ error: 'Failed to generate auth URL' });
  }
});

/**
 * GET /api/calendar/auth/callback
 * Handle OAuth callback from Google
 */
router.get('/auth/callback', async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    const tokens = await calendarService.getTokensFromCode(code);

    // In production, store these tokens securely
    console.log('Google Calendar authenticated successfully');

    res.send(`
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1 style="color: #4CAF50;">Success!</h1>
          <p>Google Calendar has been connected successfully.</p>
          <p>You can close this window and return to the dashboard.</p>
          <script>
            setTimeout(() => window.close(), 3000);
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Error handling OAuth callback:', error);
    res.status(500).send(`
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1 style="color: #f44336;">Error</h1>
          <p>Failed to connect Google Calendar.</p>
          <p>${error.message}</p>
        </body>
      </html>
    `);
  }
});

/**
 * GET /api/calendar/status
 * Check if Google Calendar is authenticated
 */
router.get('/status', (req, res) => {
  res.json({
    authenticated: calendarService.isAuthenticated(),
    calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary'
  });
});

/**
 * GET /api/calendar/availability/:date
 * Get available appointment slots for a date
 */
router.get('/availability/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const { duration } = req.query;

    const slots = await calendarService.getAvailableSlots(
      new Date(date),
      parseInt(duration) || 60
    );

    res.json({
      date,
      slots,
      count: slots.length
    });
  } catch (error) {
    console.error('Error getting availability:', error);
    res.status(500).json({ error: 'Failed to get availability' });
  }
});

/**
 * POST /api/calendar/book
 * Book an appointment
 */
router.post('/book', async (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      customerEmail,
      serviceType,
      description,
      address,
      startTime,
      durationMinutes
    } = req.body;

    // Validate required fields
    if (!customerName || !customerPhone || !serviceType || !address || !startTime) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['customerName', 'customerPhone', 'serviceType', 'address', 'startTime']
      });
    }

    const booking = await calendarService.bookAppointment({
      customerName,
      customerPhone,
      customerEmail,
      serviceType,
      description: description || `${serviceType} service request`,
      address,
      startTime: new Date(startTime),
      durationMinutes: durationMinutes || 60
    });

    res.json({
      success: true,
      booking
    });
  } catch (error) {
    console.error('Error booking appointment:', error);
    res.status(500).json({ error: 'Failed to book appointment' });
  }
});

/**
 * GET /api/calendar/appointments
 * Get upcoming appointments (for dashboard)
 */
router.get('/appointments', async (req, res) => {
  try {
    if (!calendarService.isAuthenticated()) {
      return res.status(401).json({ error: 'Calendar not authenticated' });
    }

    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // This would need to be implemented in the calendar service
    res.json({
      message: 'Appointments endpoint - implement based on needs',
      dateRange: { start, end }
    });
  } catch (error) {
    console.error('Error getting appointments:', error);
    res.status(500).json({ error: 'Failed to get appointments' });
  }
});

module.exports = router;
