require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { WebSocketServer } = require('ws');
const http = require('http');

const retellRoutes = require('./routes/retell');
const calendarRoutes = require('./routes/calendar');
const { handleRetellWebSocket } = require('./services/retellWebSocket');

const app = express();
const server = http.createServer(app);

// WebSocket server for Retell AI real-time communication
const wss = new WebSocketServer({ server, path: '/ws/retell' });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api/retell', retellRoutes);
app.use('/api/calendar', calendarRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// WebSocket connection handling for Retell AI
wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection established');
  handleRetellWebSocket(ws, req);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server available at ws://localhost:${PORT}/ws/retell`);
  console.log(`Frontend available at http://localhost:${PORT}`);
});

module.exports = { app, server };
