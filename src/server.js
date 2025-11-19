const express = require('express');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 3000;

// Security: Remove Express fingerprinting
app.disable('x-powered-by');

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Performance middleware
app.use(compression());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory data store
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
      operator: 'City Express',
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
      operator: 'Premium Travels',
    },
  ],
  bookings: [],
};

// Input validation middleware
const validateBookingInput = (req, res, next) => {
  const { busId, passengerName, email, seats } = req.body;

  if (!busId || !passengerName || !email || !seats) {
    return res.status(400).json({
      error: 'Missing required fields: busId, passengerName, email, seats',
    });
  }

  if (typeof passengerName !== 'string' || passengerName.trim().length === 0) {
    return res.status(400).json({
      error: 'Invalid passenger name',
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      error: 'Invalid email format',
    });
  }

  const parsedSeats = parseInt(seats, 10);
  if (Number.isNaN(parsedSeats) || parsedSeats < 1 || parsedSeats > 10) {
    return res.status(400).json({
      error: 'Seats must be a number between 1 and 10',
    });
  }

  return next();
};

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

// API Routes
app.get('/api/buses', (req, res) => {
  try {
    const { from, to, type } = req.query;
    let filteredBuses = [...busData.buses];

    if (from) {
      filteredBuses = filteredBuses.filter((bus) => bus.from.toLowerCase()
        .includes(from.toLowerCase()));
    }

    if (to) {
      filteredBuses = filteredBuses.filter((bus) => bus.to.toLowerCase()
        .includes(to.toLowerCase()));
    }

    if (type) {
      filteredBuses = filteredBuses.filter((bus) => bus.type.toLowerCase() 
        === type.toLowerCase());
    }

    return res.json({
      buses: filteredBuses,
      total: filteredBuses.length,
    });
  } catch (error) {
    console.error('Error in /api/buses:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/buses/:id', (req, res) => {
  try {
    const busId = parseInt(req.params.id, 10);
    const bus = busData.buses.find((b) => b.id === busId);

    if (!bus) {
      return res.status(404).json({ error: 'Bus not found' });
    }

    return res.json({ bus });
  } catch (error) {
    console.error('Error in /api/buses/:id:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/book', validateBookingInput, (req, res) => {
  try {
    const {
      busId, passengerName, email, seats, paymentMethod,
    } = req.body;

    const bus = busData.buses.find((b) => b.id === parseInt(busId, 10));

    if (!bus) {
      return res.status(404).json({ error: 'Bus not found' });
    }

    const parsedSeats = parseInt(seats, 10);
    if (parsedSeats > bus.available) {
      return res.status(400).json({
        error: `Only ${bus.available} seats available`,
      });
    }

    bus.available -= parsedSeats;

    const booking = {
      id: Date.now(),
      busId: parseInt(busId, 10),
      passengerName: passengerName.trim(),
      email: email.trim(),
      seats: parsedSeats,
      totalPrice: bus.price * parsedSeats,
      paymentMethod: paymentMethod || 'credit_card',
      bookingDate: new Date().toISOString(),
      status: 'confirmed',
      pnr: `PNR${Date.now().toString().slice(-6)}`,
    };

    busData.bookings.push(booking);

    return res.json({
      success: true,
      booking,
      message: `Successfully booked ${seats} seat(s) on ${bus.name}`,
      pnr: booking.pnr,
    });
  } catch (error) {
    console.error('Error in /api/book:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/bookings', (req, res) => {
  try {
    const { email } = req.query;
    let filteredBookings = busData.bookings;

    if (email) {
      filteredBookings = busData.bookings.filter((booking) => booking.email
        .toLowerCase().includes(email.toLowerCase()));
    }

    return res.json({
      bookings: filteredBookings,
      total: filteredBookings.length,
    });
  } catch (error) {
    console.error('Error in /api/bookings:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/admin/stats', (req, res) => {
  try {
    const totalBookings = busData.bookings.length;
    const confirmedBookings = busData.bookings
      .filter((b) => b.status === 'confirmed').length;
    const totalRevenue = busData.bookings
      .filter((b) => b.status === 'confirmed')
      .reduce((sum, booking) => sum + booking.totalPrice, 0);

    return res.json({
      totalBookings,
      confirmedBookings,
      totalRevenue,
      totalBuses: busData.buses.length,
    });
  } catch (error) {
    console.error('Error in /api/admin/stats:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/health', (req, res) => res.json({
  status: 'OK',
  timestamp: new Date().toISOString(),
  uptime: process.uptime(),
  version: '2.0.0',
}));

// 404 handler
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  return res.status(500).json({
    error: 'Internal server error',
    version: '2.0.0',
  });
});

// Export for testing
module.exports = { app, busData };

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚌 Server running on port ${PORT}`);
  });
}
