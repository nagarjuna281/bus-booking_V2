const express = require('express');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Enhanced bus data
const busData = {
  buses: [
    // ... your bus data ...
  ],
  bookings: []
};

// FIX: Configure static file serving FIRST
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1d', // Cache for 1 day
  etag: true
}));

// Then add other middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https:"],
      connectSrc: ["'self'"]
    }
  }
}));

app.use(compression());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/booking', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'booking.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

// ... rest of your API routes ...

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚌 Bus Booking V2 server running on port ${PORT}`);
    console.log(`📁 Static files serving from: ${path.join(__dirname, 'public')}`);
    console.log(`🎨 CSS available at: http://localhost:${PORT}/css/style.css`);
  });
}

module.exports = app;
