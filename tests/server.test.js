const request = require('supertest');
const app = require('../src/server');

describe('Bus Booking API V2', () => {
  // Reset bus data before each test
  beforeEach(() => {
    // Reset bus availability to initial state
    const busData = require('../src/server').busData;
    busData.buses = [
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
      }
    ];
    busData.bookings = [];
  });

  describe('GET /api/buses', () => {
    it('should return all buses with enhanced filtering', async () => {
      const response = await request(app).get('/api/buses');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('buses');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.buses)).toBe(true);
      expect(response.body.buses.length).toBeGreaterThan(0);
    });

    it('should filter buses by type', async () => {
      const response = await request(app)
        .get('/api/buses?type=AC Sleeper');
      
      expect(response.status).toBe(200);
      if (response.body.buses.length > 0) {
        expect(response.body.buses.every(bus => 
          bus.type === 'AC Sleeper'
        )).toBe(true);
      }
    });

    it('should sort buses by price', async () => {
      const response = await request(app)
        .get('/api/buses?sortBy=price');
      
      expect(response.status).toBe(200);
      if (response.body.buses.length > 1) {
        const prices = response.body.buses.map(bus => bus.price);
        const sortedPrices = [...prices].sort((a, b) => a - b);
        expect(prices).toEqual(sortedPrices);
      }
    });
  });

  describe('GET /api/buses/:id', () => {
    it('should return specific bus details', async () => {
      const response = await request(app).get('/api/buses/1');
      
      expect(response.status).toBe(200);
      expect(response.body.bus.id).toBe(1);
      expect(response.body.bus).toHaveProperty('amenities');
    });

    it('should return 404 for invalid bus ID', async () => {
      const response = await request(app).get('/api/buses/999');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/book', () => {
    it('should book seats with enhanced data', async () => {
      const bookingData = {
        busId: 1,
        passengerName: 'John Doe',
        email: 'john@example.com',
        seats: 2,
        paymentMethod: 'credit_card'
      };

      const response = await request(app)
        .post('/api/book')
        .send(bookingData);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.booking).toHaveProperty('email');
      expect(response.body.booking).toHaveProperty('pnr');
      expect(response.body.booking.passengerName).toBe('John Doe');
    });

    it('should require email field', async () => {
      const response = await request(app)
        .post('/api/book')
        .send({
          busId: 1,
          passengerName: 'John Doe',
          seats: 1
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should fail for insufficient seats', async () => {
      const response = await request(app)
        .post('/api/book')
        .send({
          busId: 1,
          passengerName: 'John Doe',
          email: 'john@example.com',
          seats: 100  // More than available
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/bookings', () => {
    it('should return all bookings', async () => {
      const response = await request(app).get('/api/bookings');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('bookings');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.bookings)).toBe(true);
    });

    it('should filter bookings by email', async () => {
      // First create a booking
      await request(app)
        .post('/api/book')
        .send({
          busId: 1,
          passengerName: 'Test User',
          email: 'test@example.com',
          seats: 1
        });

      const response = await request(app)
        .get('/api/bookings?email=test@example.com');
      
      expect(response.status).toBe(200);
      if (response.body.bookings.length > 0) {
        expect(response.body.bookings[0].email).toBe('test@example.com');
      }
    });
  });

  describe('POST /api/bookings/:id/cancel', () => {
    it('should cancel a booking', async () => {
      // First create a booking
      const bookingResponse = await request(app)
        .post('/api/book')
        .send({
          busId: 2,
          passengerName: 'Test User',
          email: 'test@example.com',
          seats: 1
        });

      // FIX: Check if booking was created successfully
      expect(bookingResponse.status).toBe(200);
      expect(bookingResponse.body.booking).toBeDefined();
      
      const bookingId = bookingResponse.body.booking.id;

      const response = await request(app)
        .post(`/api/bookings/${bookingId}/cancel`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 404 for invalid booking ID', async () => {
      const response = await request(app)
        .post('/api/bookings/999/cancel');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/admin/stats', () => {
    it('should return admin statistics', async () => {
      // Create some bookings first
      await request(app)
        .post('/api/book')
        .send({
          busId: 1,
          passengerName: 'Stats User',
          email: 'stats@example.com',
          seats: 2
        });

      const response = await request(app).get('/api/admin/stats');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalBookings');
      expect(response.body).toHaveProperty('totalRevenue');
      expect(response.body).toHaveProperty('totalBuses');
      expect(response.body).toHaveProperty('confirmedBookings');
    });
  });

  describe('Error handling', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/unknown-route');
      expect(response.status).toBe(404);
    });

    it('should handle invalid JSON', async () => {
      const response = await request(app)
        .post('/api/book')
        .set('Content-Type', 'application/json')
        .send('invalid json');
      
      expect(response.status).toBe(400);
    });
  });
});
