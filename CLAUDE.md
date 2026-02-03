# CLAUDE.md - AI Assistant Guide for Retell AI Plumbing Receptionist

## Project Overview

This is a **Retell AI Voice Agent System** for a plumbing company receptionist. The system enables automated phone call handling with AI-powered voice responses and integrates with Google Calendar for appointment booking.

### Core Purpose
- Answer incoming calls as a virtual receptionist for a plumbing company
- Understand customer plumbing needs and emergencies
- Collect customer information (name, phone, address, issue description)
- Book appointments directly into Google Calendar
- Provide information about available services

## Technology Stack

| Component | Technology |
|-----------|------------|
| Runtime | Node.js (v18+) |
| Backend Framework | Express.js |
| Voice AI | Retell AI SDK |
| Calendar | Google Calendar API (googleapis) |
| Real-time Communication | WebSocket (ws) |
| Frontend | Vanilla HTML/CSS/JavaScript |

## Project Structure

```
retell-ai-system/
├── backend/
│   ├── server.js              # Main Express server with WebSocket
│   ├── config/
│   │   └── agentConfig.js     # Voice agent personality and prompts
│   ├── routes/
│   │   ├── retell.js          # Retell AI webhook and API routes
│   │   └── calendar.js        # Google Calendar API routes
│   └── services/
│       ├── googleCalendar.js  # Google Calendar integration service
│       └── retellWebSocket.js # Real-time voice call handling
├── frontend/
│   ├── index.html             # Dashboard UI
│   ├── styles.css             # Dashboard styling
│   └── app.js                 # Dashboard interactivity
├── package.json               # Dependencies and scripts
├── .env.example               # Environment variables template
├── README.md                  # Project documentation
└── CLAUDE.md                  # This file - AI assistant guide
```

## Key Files and Their Purposes

### Backend

#### `backend/server.js`
Main entry point. Sets up Express server, WebSocket server for Retell AI, and serves static frontend files.

#### `backend/config/agentConfig.js`
**Critical file** - Contains the voice agent's personality, system prompt, and function definitions. This is where the AI receptionist's behavior is defined.

Key configuration includes:
- Agent name and voice settings
- System prompt with personality guidelines
- Available functions (book_appointment, check_availability, etc.)
- Conversation settings (responsiveness, interrupt sensitivity)

#### `backend/services/googleCalendar.js`
Handles all Google Calendar operations:
- OAuth2 authentication flow
- Booking appointments
- Checking availability
- Managing time slots

#### `backend/services/retellWebSocket.js`
Handles real-time WebSocket communication with Retell AI:
- Processing incoming voice transcripts
- Executing function calls (booking, availability checks)
- Managing conversation context

#### `backend/routes/retell.js`
REST API endpoints for Retell AI:
- `/api/retell/webhook` - Main webhook for call events
- `/api/retell/create-call` - Create outbound calls
- `/api/retell/create-web-call` - Create browser-based test calls

#### `backend/routes/calendar.js`
REST API endpoints for calendar:
- `/api/calendar/auth` - Start Google OAuth flow
- `/api/calendar/availability/:date` - Get available slots
- `/api/calendar/book` - Book an appointment

### Frontend

Single-page dashboard for managing the receptionist system:
- View system status
- Test voice agent calls
- Connect Google Calendar
- Manually book appointments
- View agent configuration

## Environment Variables

Required environment variables (see `.env.example`):

```bash
# Retell AI (Required)
RETELL_API_KEY=         # Your Retell AI API key

# Server
PORT=3000               # Server port

# Google Calendar (Required for booking)
GOOGLE_CLIENT_ID=       # From Google Cloud Console
GOOGLE_CLIENT_SECRET=   # From Google Cloud Console
GOOGLE_REDIRECT_URI=    # OAuth callback URL

# Company Info (Customizable)
COMPANY_NAME=           # Displayed company name
COMPANY_PHONE=          # Company phone number
SERVICE_AREA=           # Service area description
```

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (with auto-reload)
npm run dev

# Start production server
npm start
```

## API Endpoints Reference

### Health Check
- `GET /api/health` - Check server status

### Retell AI
- `POST /api/retell/webhook` - Receive Retell events
- `POST /api/retell/create-call` - Create outbound phone call
- `POST /api/retell/create-web-call` - Create browser-based call
- `GET /api/retell/call/:callId` - Get call details
- `GET /api/retell/agent-config` - Get agent configuration

### Calendar
- `GET /api/calendar/auth` - Get Google OAuth URL
- `GET /api/calendar/auth/callback` - OAuth callback
- `GET /api/calendar/status` - Check authentication status
- `GET /api/calendar/availability/:date` - Get available slots
- `POST /api/calendar/book` - Book appointment

## Voice Agent Functions

The AI receptionist can call these functions during conversations:

| Function | Purpose |
|----------|---------|
| `book_appointment` | Book a service appointment in Google Calendar |
| `check_availability` | Check available time slots for a date |
| `get_service_info` | Get information about plumbing services |
| `update_customer_info` | Update customer details during call |

## Common Development Tasks

### Modifying the AI Receptionist Personality

Edit `backend/config/agentConfig.js`:
- Modify `systemPrompt` for behavior changes
- Update `functions` array to add/remove capabilities
- Adjust voice settings (`voice`, `voiceSpeed`, etc.)

### Adding New Plumbing Services

1. Add to service enum in `agentConfig.js` function definitions
2. Add service details in `retellWebSocket.js` `getServiceInfo()` function
3. Update the frontend dropdown in `index.html`

### Changing Business Hours

Edit `backend/services/googleCalendar.js`:
- Modify `businessStart` and `businessEnd` in `getAvailableSlots()`
- Update the agent prompt in `agentConfig.js`

### Adding New API Endpoints

1. Create route file in `backend/routes/`
2. Import and mount in `backend/server.js`
3. Add corresponding frontend integration if needed

## Testing the Voice Agent

1. Set `RETELL_API_KEY` in environment
2. Start server with `npm run dev`
3. Open http://localhost:3000
4. Click "Start Test Call" to initiate browser-based call

For phone-based testing, configure your Retell AI phone number to point to your webhook URL.

## Production Deployment

1. Set all environment variables
2. Configure HTTPS (required for production WebSocket)
3. Set `NODE_ENV=production`
4. Update `WEBHOOK_URL` to your production domain
5. Run with process manager (PM2 recommended)

## Important Conventions

### Code Style
- Use async/await for asynchronous operations
- Use try/catch for error handling
- Log errors with `console.error()`
- Use descriptive variable names

### File Organization
- Routes handle HTTP request/response only
- Services contain business logic
- Config files for settings that may change

### Error Handling
- Return structured JSON errors: `{ error: "message" }`
- Log all errors server-side
- Provide user-friendly messages to frontend

## Troubleshooting

### "Calendar not authenticated"
- Click "Connect Google Calendar" in dashboard
- Complete OAuth flow in popup window
- Ensure GOOGLE_CLIENT_ID and SECRET are set

### "Failed to start call"
- Verify RETELL_API_KEY is set correctly
- Check Retell AI dashboard for quota/billing issues
- Ensure RETELL_AGENT_ID is configured

### WebSocket connection issues
- Verify server is running
- Check firewall/proxy settings
- Ensure correct port is exposed

## External Resources

- [Retell AI Documentation](https://docs.retellai.com/)
- [Google Calendar API Reference](https://developers.google.com/calendar/api)
- [Express.js Guide](https://expressjs.com/)
