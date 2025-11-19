const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files FIRST
app.use(express.static(path.join(__dirname, 'public')));

// Simple in-memory data
const buses = [
  {
    id: 1,
    name: 'Express Bus',
    from: 'New York',
    to: 'Boston',
    price: 45,
    available: 35
  },
  {
    id: 2, 
    name: 'Luxury Coach',
    from: 'New York',
    to: 'Washington DC',
    price: 65,
    available: 42
  }
];

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/booking', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'booking.html'));
});

// API
app.get('/api/buses', (req, res) => {
  res.json({ buses });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', version: '2.0.0' });
});

app.listen(PORT, () => {
  console.log(`🚌 Server running on port ${PORT}`);
});
