# Retell AI Plumbing Receptionist

An AI-powered voice agent system for handling plumbing company phone calls and booking appointments.

## Features

- **AI Voice Receptionist**: Automatically answers calls with a friendly, professional voice
- **Smart Scheduling**: Books appointments directly into Google Calendar
- **Service Understanding**: Handles various plumbing service types (emergency, drain cleaning, water heaters, etc.)
- **Real-time Dashboard**: Web interface for monitoring and manual booking
- **24/7 Availability**: Never miss a customer call

## Quick Start

### Prerequisites

- Node.js 18+
- Retell AI account and API key
- Google Cloud project with Calendar API enabled

### Installation

1. Clone the repository:
```bash
git clone https://github.com/mikeyd21/retell-ai-system.git
cd retell-ai-system
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your API keys
```

4. Start the server:
```bash
npm run dev
```

5. Open http://localhost:3000 in your browser

## Configuration

### Required Environment Variables

| Variable | Description |
|----------|-------------|
| `RETELL_API_KEY` | Your Retell AI API key |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |

### Optional Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Server port |
| `COMPANY_NAME` | ABC Plumbing Services | Your company name |
| `COMPANY_PHONE` | (555) 123-4567 | Company phone number |
| `SERVICE_AREA` | Greater Metro Area | Service coverage area |

## Architecture

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Phone Call    │────▶│  Retell AI   │────▶│  Your Server    │
└─────────────────┘     └──────────────┘     └────────┬────────┘
                                                      │
                        ┌──────────────┐              │
                        │   Google     │◀─────────────┘
                        │   Calendar   │
                        └──────────────┘
```

## Services Offered

The AI receptionist is configured to handle:

- Emergency Plumbing (24/7)
- Drain Cleaning
- Water Heater Services
- Leak Detection & Repair
- Fixture Installation
- General Plumbing Maintenance

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/retell/webhook` | POST | Retell AI webhook |
| `/api/retell/create-web-call` | POST | Start browser test call |
| `/api/calendar/auth` | GET | Start Google OAuth |
| `/api/calendar/book` | POST | Book appointment |
| `/api/calendar/availability/:date` | GET | Check availability |

## Development

```bash
# Run in development mode with auto-reload
npm run dev

# Run tests
npm test

# Start production server
npm start
```

## License

MIT

## Support

For issues and feature requests, please open a GitHub issue.
