/**
 * Plumbing Receptionist Dashboard - Frontend Application
 */

// API Base URL
const API_BASE = '/api';

// State
let isCallActive = false;
let currentCallId = null;

// DOM Elements
const elements = {
  systemStatus: document.getElementById('systemStatus'),
  todayCalls: document.getElementById('todayCalls'),
  appointmentsBooked: document.getElementById('appointmentsBooked'),
  calendarStatus: document.getElementById('calendarStatus'),
  testCallBtn: document.getElementById('testCallBtn'),
  connectCalendarBtn: document.getElementById('connectCalendarBtn'),
  viewConfigBtn: document.getElementById('viewConfigBtn'),
  testCallSection: document.getElementById('testCallSection'),
  configSection: document.getElementById('configSection'),
  startCallBtn: document.getElementById('startCallBtn'),
  endCallBtn: document.getElementById('endCallBtn'),
  callStatusText: document.getElementById('callStatusText'),
  transcript: document.getElementById('transcript'),
  agentConfigDisplay: document.getElementById('agentConfigDisplay'),
  bookingForm: document.getElementById('bookingForm'),
  toastContainer: document.getElementById('toastContainer')
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  checkSystemHealth();
  checkCalendarStatus();
  setupEventListeners();
  setMinDate();
});

// Setup Event Listeners
function setupEventListeners() {
  elements.testCallBtn.addEventListener('click', toggleTestCallSection);
  elements.connectCalendarBtn.addEventListener('click', connectGoogleCalendar);
  elements.viewConfigBtn.addEventListener('click', toggleConfigSection);
  elements.startCallBtn.addEventListener('click', startTestCall);
  elements.endCallBtn.addEventListener('click', endTestCall);
  elements.bookingForm.addEventListener('submit', handleBookingSubmit);
}

// Check System Health
async function checkSystemHealth() {
  try {
    const response = await fetch(`${API_BASE}/health`);
    const data = await response.json();

    if (data.status === 'healthy') {
      updateSystemStatus('connected', 'System Online');
    } else {
      updateSystemStatus('error', 'System Error');
    }
  } catch (error) {
    console.error('Health check failed:', error);
    updateSystemStatus('error', 'Connection Failed');
  }
}

// Check Calendar Status
async function checkCalendarStatus() {
  try {
    const response = await fetch(`${API_BASE}/calendar/status`);
    const data = await response.json();

    if (data.authenticated) {
      elements.calendarStatus.textContent = 'Connected';
      elements.calendarStatus.classList.add('connected');
      elements.connectCalendarBtn.textContent = 'Calendar Connected';
      elements.connectCalendarBtn.disabled = true;
    } else {
      elements.calendarStatus.textContent = 'Not Connected';
      elements.calendarStatus.classList.remove('connected');
    }
  } catch (error) {
    console.error('Calendar status check failed:', error);
  }
}

// Update System Status
function updateSystemStatus(status, text) {
  const dot = elements.systemStatus.querySelector('.status-dot');
  const textEl = elements.systemStatus.querySelector('.status-text');

  dot.className = 'status-dot';
  if (status === 'connected') {
    dot.classList.add('connected');
  } else if (status === 'error') {
    dot.classList.add('error');
  }

  textEl.textContent = text;
}

// Toggle Test Call Section
function toggleTestCallSection() {
  const isVisible = elements.testCallSection.style.display !== 'none';
  elements.testCallSection.style.display = isVisible ? 'none' : 'block';
  elements.configSection.style.display = 'none';
}

// Toggle Config Section
async function toggleConfigSection() {
  const isVisible = elements.configSection.style.display !== 'none';

  if (isVisible) {
    elements.configSection.style.display = 'none';
  } else {
    elements.configSection.style.display = 'block';
    elements.testCallSection.style.display = 'none';

    try {
      const response = await fetch(`${API_BASE}/retell/agent-config`);
      const config = await response.json();
      elements.agentConfigDisplay.textContent = JSON.stringify(config, null, 2);
    } catch (error) {
      elements.agentConfigDisplay.textContent = 'Failed to load agent configuration';
    }
  }
}

// Connect Google Calendar
async function connectGoogleCalendar() {
  try {
    const response = await fetch(`${API_BASE}/calendar/auth`);
    const data = await response.json();

    if (data.authUrl) {
      // Open auth URL in a new window
      const authWindow = window.open(data.authUrl, 'Google Calendar Auth', 'width=600,height=700');

      // Check for auth completion
      const checkAuth = setInterval(async () => {
        try {
          if (authWindow.closed) {
            clearInterval(checkAuth);
            await checkCalendarStatus();
          }
        } catch (e) {
          // Window closed or cross-origin error
        }
      }, 1000);
    }
  } catch (error) {
    showToast('Failed to start calendar authentication', 'error');
  }
}

// Start Test Call
async function startTestCall() {
  try {
    elements.startCallBtn.disabled = true;
    elements.callStatusText.textContent = 'Starting call...';

    const response = await fetch(`${API_BASE}/retell/create-web-call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await response.json();

    if (data.success) {
      isCallActive = true;
      currentCallId = data.callId;
      elements.callStatusText.textContent = 'Call in progress...';
      elements.endCallBtn.disabled = false;
      elements.transcript.innerHTML = '';

      // In a real implementation, you would connect to the WebSocket
      // and handle real-time audio/transcript here
      showToast('Test call started', 'success');
    } else {
      throw new Error(data.error || 'Failed to start call');
    }
  } catch (error) {
    console.error('Failed to start test call:', error);
    elements.callStatusText.textContent = 'Failed to start call';
    elements.startCallBtn.disabled = false;
    showToast('Failed to start test call. Make sure RETELL_API_KEY is configured.', 'error');
  }
}

// End Test Call
function endTestCall() {
  isCallActive = false;
  currentCallId = null;
  elements.callStatusText.textContent = 'Call ended';
  elements.startCallBtn.disabled = false;
  elements.endCallBtn.disabled = true;
  showToast('Test call ended', 'info');
}

// Handle Booking Form Submit
async function handleBookingSubmit(e) {
  e.preventDefault();

  const formData = new FormData(e.target);
  const appointmentDate = formData.get('appointmentDate');
  const appointmentTime = formData.get('appointmentTime');

  const bookingData = {
    customerName: formData.get('customerName'),
    customerPhone: formData.get('customerPhone'),
    customerEmail: formData.get('customerEmail') || undefined,
    serviceType: formData.get('serviceType'),
    address: formData.get('address'),
    description: formData.get('description'),
    startTime: `${appointmentDate}T${appointmentTime}:00`
  };

  try {
    const response = await fetch(`${API_BASE}/calendar/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData)
    });

    const data = await response.json();

    if (data.success) {
      showToast('Appointment booked successfully!', 'success');
      e.target.reset();
      setMinDate();

      // Update stats
      const current = parseInt(elements.appointmentsBooked.textContent) || 0;
      elements.appointmentsBooked.textContent = current + 1;
    } else {
      throw new Error(data.error || 'Failed to book appointment');
    }
  } catch (error) {
    console.error('Booking failed:', error);
    showToast(`Booking failed: ${error.message}`, 'error');
  }
}

// Set Minimum Date for Date Picker
function setMinDate() {
  const dateInput = document.getElementById('appointmentDate');
  const today = new Date().toISOString().split('T')[0];
  dateInput.min = today;
  dateInput.value = today;
}

// Show Toast Notification
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;

  elements.toastContainer.appendChild(toast);

  // Remove after 5 seconds
  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

// Simulate updating stats (in production, this would come from the backend)
function updateStats() {
  // This would typically fetch from an analytics endpoint
}
