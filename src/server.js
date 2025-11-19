const express = require('express');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Enhanced bus data
const busData = {
  buses: [
    {
      id: 1,
      name: 'Express Deluxe',
      from: 'New York',
      to: 'Boston',
      departure: '08:00 AM',
      arrival: '12:00 PM',
      price: 45,
      seats: 40,
      available: 35,
      type: 'AC Sleeper',
      amenities: ['WiFi', 'Charging Port', 'Snacks'],
      duration: '4h',
      operator: 'City Express'
    },
    {
      id: 2,
      name: 'Luxury Coach Plus',
      from: 'New York',
      to: 'Washington DC',
      departure: '09:30 AM',
      arrival: '02:30 PM',
      price: 65,
      seats: 50,
      available: 42,
      type: 'Luxury Coach',
      amenities: ['WiFi', 'Charging Port', 'Meal', 'Entertainment'],
      duration: '5h',
      operator: 'Premium Travels'
    },
    {
      id: 3,
      name: 'Night Express',
      from: 'Boston',
      to: 'New York',
      departure: '10:00 PM',
      arrival: '02:00 AM',
      price: 55,
      seats: 35,
      available: 28,
      type: 'AC Sleeper',
      amenities: ['WiFi', 'Blanket', 'Water'],
      duration: '4h',
      operator: 'Night Riders'
    }
  ],
  bookings: []
};

// CRITICAL FIX: Static file serving MUST come first
app.use(express.static(path.join(__dirname, 'public')));

// Security middleware with relaxed CSP for development
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'"],
      connectSrc: ["'self'"]
    }
  }
}));

app.use(compression());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Debug route to check if static files are working
app.get('/debug-static', (req, res) => {
  const publicPath = path.join(__dirname, 'public');
  const cssPath = path.join(__dirname, 'public', 'css', 'style.css');
  const jsPath = path.join(__dirname, 'public', 'js', 'app.js');
  
  const debugInfo = {
    serverRoot: __dirname,
    publicPath: publicPath,
    publicExists: fs.existsSync(publicPath),
    cssPath: cssPath,
    cssExists: fs.existsSync(cssPath),
    jsPath: jsPath,
    jsExists: fs.existsSync(jsPath),
    publicFiles: fs.existsSync(publicPath) ? fs.readdirSync(publicPath) : 'NOT FOUND',
    cssFiles: fs.existsSync(path.join(publicPath, 'css')) ? fs.readdirSync(path.join(publicPath, 'css')) : 'NOT FOUND',
    jsFiles: fs.existsSync(path.join(publicPath, 'js')) ? fs.readdirSync(path.join(publicPath, 'js')) : 'NOT FOUND'
  };
  
  res.json(debugInfo);
});

// Test route to verify CSS and JS are loading
app.get('/test-full', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Full Test - CSS & JS</title>
        <link rel="stylesheet" href="/css/style.css">
    </head>
    <body>
        <header>
            <nav class="navbar">
                <div class="nav-container">
                    <h1 class="logo">🚌 Test Page</h1>
                    <ul class="nav-menu">
                        <li><a href="/" class="nav-link active">Home</a></li>
                    </ul>
                </div>
            </nav>
        </header>

        <main>
            <section class="hero">
                <div class="hero-content">
                    <h2>CSS & JavaScript Test</h2>
                    <p>If you see styling and the button works, everything is loaded correctly!</p>
                    <button id="testBtn" class="cta-button">Test JavaScript</button>
                    <div id="testResult" style="margin-top: 1rem;"></div>
                </div>
            </section>

            <section class="features">
                <div class="container">
                    <h3>Test Features</h3>
                    <div class="features-grid">
                        <div class="feature-card">
                            <h4>CSS Test</h4>
                            <p>This card should be styled</p>
                        </div>
                        <div class="feature-card">
                            <h4>JS Test</h4>
                            <p>Click the button above</p>
                        </div>
                    </div>
                </div>
            </section>
        </main>

        <footer>
            <div class="container">
                <p>&copy; 2024 Test Page</p>
            </div>
        </footer>

        <script src="/js/app.js"></script>
        <script>
            document.getElementById('testBtn').addEventListener('click', function() {
                document.getElementById('testResult').innerHTML = 
                    '<div class="booking-result success">✅ JavaScript is working! App object: ' + (typeof app) + '</div>';
            });
        </script>
    </body>
    </html>
  `);
});

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

// API endpoints
app.get('/api/buses', (req, res) => {
  const { from, to, type, sortBy } = req.query;
  
  let filteredBuses = [...busData.buses];

  if (from) {
    filteredBuses = filteredBuses.filter(bus => 
      bus.from.toLowerCase().includes(from.toLowerCase())
    );
  }
  
  if (to) {
    filteredBuses = filteredBuses.filter(bus => 
      bus.to.toLowerCase().includes(to.toLowerCase())
    );
  }

  if (type) {
    filteredBuses = filteredBuses.filter(bus => 
      bus.type.toLowerCase() === type.toLowerCase()
    );
  }

  if (sortBy === 'price') {
    filteredBuses.sort((a, b) => a.price - b.price);
  } else if (sortBy === 'departure') {
    filteredBuses.sort((a, b) => a.departure.localeCompare(b.departure));
  }

  res.json({ 
    buses: filteredBuses,
    total: filteredBuses.length
  });
});

app.get('/api/buses/:id', (req, res) => {
  const busId = parseInt(req.params.id, 10);
  const bus = busData.buses.find(b => b.id === busId);
  
  if (!bus) {
    return res.status(404).json({ error: 'Bus not found' });
  }
  
  res.json({ bus });
});

app.post('/api/book', (req, res) => {
  const { busId, passengerName, email, seats, paymentMethod } = req.body;

  if (!busId || !passengerName || !email || !seats) {
    return res.status(400).json({
      error: 'Missing required fields: busId, passengerName, email, seats'
    });
  }

  const bus = busData.buses.find(b => b.id === parseInt(busId, 10));

  if (!bus) {
    return res.status(404).json({ error: 'Bus not found' });
  }

  if (seats > bus.available) {
    return res.status(400).json({ 
      error: `Only ${bus.available} seats available` 
    });
  }

  bus.available -= parseInt(seats, 10);

  const booking = {
    id: Date.now(),
    busId: parseInt(busId, 10),
    passengerName,
    email,
    seats: parseInt(seats, 10),
    totalPrice: bus.price * parseInt(seats, 10),
    paymentMethod: paymentMethod || 'credit_card',
    bookingDate: new Date().toISOString(),
    status: 'confirmed',
    pnr: `PNR${Date.now().toString().slice(-6)}`
  };

  busData.bookings.push(booking);

  res.json({
    success: true,
    booking,
    message: `Successfully booked ${seats} seat(s) on ${bus.name}`,
    pnr: booking.pnr
  });
});

app.get('/api/bookings', (req, res) => {
  const { email } = req.query;
  
  let filteredBookings = busData.bookings;

  if (email) {
    filteredBookings = filteredBookings.filter(booking => 
      booking.email.toLowerCase().includes(email.toLowerCase())
    );
  }

  res.json({
    bookings: filteredBookings,
    total: filteredBookings.length
  });
});

app.post('/api/bookings/:id/cancel', (req, res) => {
  const bookingId = parseInt(req.params.id, 10);
  const bookingIndex = busData.bookings.findIndex(b => b.id === bookingId);

  if (bookingIndex === -1) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  const booking = busData.bookings[bookingIndex];
  const bus = busData.buses.find(b => b.id === booking.busId);

  if (bus) {
    bus.available += booking.seats;
  }

  busData.bookings[bookingIndex].status = 'cancelled';

  res.json({
    success: true,
    message: 'Booking cancelled successfully'
  });
});

app.get('/api/admin/stats', (req, res) => {
  const totalBookings = busData.bookings.length;
  const confirmedBookings = busData.bookings.filter(b => b.status === 'confirmed').length;
  const totalRevenue = busData.bookings
    .filter(b => b.status === 'confirmed')
    .reduce((sum, booking) => sum + booking.totalPrice, 0);

  res.json({
    totalBookings,
    confirmedBookings,
    totalRevenue,
    totalBuses: busData.buses.length
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '2.0.0',
    stats: {
      totalBuses: busData.buses.length,
      totalBookings: busData.bookings.length,
      availableSeats: busData.buses.reduce((sum, bus) => sum + bus.available, 0)
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    version: '2.0.0'
  });
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚌 Bus Booking V2 server running on port ${PORT}`);
    console.log(`📁 Static files: http://localhost:${PORT}/css/style.css`);
    console.log(`🔧 JavaScript: http://localhost:${PORT}/js/app.js`);
    console.log(`🎨 Test page: http://localhost:${PORT}/test-full`);
    console.log(`🔍 Debug info: http://localhost:${PORT}/debug-static`);
    console.log(`🏠 Homepage: http://localhost:${PORT}/`);
  });
}

module.exports = app;
