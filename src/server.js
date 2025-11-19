const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Security: Remove Express fingerprinting
app.disable('x-powered-by');

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Parse JSON bodies
app.use(express.json());

// Data storage
const data = {
  buses: [
    {
      id: 1,
      name: 'Express Deluxe V2',
      from: 'New York',
      to: 'Boston',
      departure: '08:00 AM',
      arrival: '12:00 PM',
      price: 45,
      seats: 40,
      available: 35,
      type: 'AC Sleeper',
      amenities: ['WiFi', 'Charging Port'],
      duration: '4h'
    },
    {
      id: 2,
      name: 'Luxury Coach V2',
      from: 'New York',
      to: 'Washington DC',
      departure: '09:30 AM',
      arrival: '02:30 PM',
      price: 65,
      seats: 50,
      available: 42,
      type: 'Luxury Coach',
      amenities: ['WiFi', 'Meal', 'Entertainment'],
      duration: '5h'
    }
  ],
  bookings: []
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
  res.json({ 
    success: true,
    buses: data.buses,
    total: data.buses.length,
    version: '2.0.0'
  });
});

app.get('/api/buses/:id', (req, res) => {
  const busId = parseInt(req.params.id, 10);
  const bus = data.buses.find(b => b.id === busId);
  
  if (!bus) {
    return res.status(404).json({ 
      success: false,
      error: 'Bus not found' 
    });
  }
  
  res.json({ 
    success: true,
    bus 
  });
});

app.post('/api/book', (req, res) => {
  const { busId, passengerName, email, seats } = req.body;
  
  // Basic validation
  if (!busId || !passengerName || !email || !seats) {
    return res.status(400).json({
      success: false,
      error: 'All fields are required'
    });
  }
  
  const bus = data.buses.find(b => b.id === parseInt(busId, 10));
  
  if (!bus) {
    return res.status(404).json({
      success: false,
      error: 'Bus not found'
    });
  }
  
  const numSeats = parseInt(seats, 10);
  if (numSeats > bus.available) {
    return res.status(400).json({
      success: false,
      error: 'Not enough seats available'
    });
  }
  
  // Create booking
  const booking = {
    id: Date.now(),
    busId: parseInt(busId, 10),
    passengerName,
    email,
    seats: numSeats,
    totalPrice: bus.price * numSeats,
    status: 'confirmed',
    pnr: `PNR${Date.now()}`,
    bookingDate: new Date().toISOString()
  };
  
  data.bookings.push(booking);
  bus.available -= numSeats;
  
  res.json({
    success: true,
    booking,
    message: 'Booking confirmed successfully'
  });
});

app.get('/api/bookings', (req, res) => {
  res.json({
    success: true,
    bookings: data.bookings,
    total: data.bookings.length
  });
});

app.get('/api/admin/stats', (req, res) => {
  const totalRevenue = data.bookings.reduce((sum, booking) => sum + booking.totalPrice, 0);
  
  res.json({
    success: true,
    stats: {
      totalBuses: data.buses.length,
      totalBookings: data.bookings.length,
      totalRevenue,
      confirmedBookings: data.bookings.filter(b => b.status === 'confirmed').length
    }
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚌 Bus Booking V2 running on port ${PORT}`);
});
