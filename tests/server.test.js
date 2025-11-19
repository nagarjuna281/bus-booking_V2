const request = require('supertest');
const { app, busData } = require('../src/server');

describe('Bus Booking API V2', () => {
  beforeEach(() => {
    // Reset data before each test
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
    it('should return all buses', async () => {
      const response = await request(app).get('/api/buses');
      expect(response.status).toBe(200);
      expect(response.body.buses).toHaveLength(2);
    });

    it('should filter buses by destination', async () => {
      const response = await request(app).get('/api/buses?to=Boston');
      expect(response.status).toBe(200);
      expect(response.body.buses[0].to).toBe('Boston');
    });

    it('should return empty array for no matches', async () => {
      const response = await request(app).get('/api/buses?from=Unknown');
      expect(response.status).toBe(200);
      expect(response.body.buses).toHaveLength(0);
    });
  });

  describe('GET /api/buses/:id', () => {
    it('should return bus details', async () => {
      const response = await request(app).get('/api/buses/1');
      expect(response.status).toBe(200);
      expect(response.body.bus.id).toBe(1);
    });

    it('should return 404 for invalid bus', async () => {
      const response = await request(app).get('/api/buses/999');
      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/book', () => {
    it('should create booking successfully', async () => {
      const bookingData = {
        busId: 1,
        passengerName: 'John Doe',
        email: 'john@example.com',
        seats: 2
      };

      const response = await request(app)
        .post('/api/book')
        .send(bookingData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.booking.passengerName).toBe('John Doe');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/book')
        .send({});

      expect(response.status).toBe(400);
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/book')
        .send({
          busId: 1,
          passengerName: 'John',
          email: 'invalid-email',
          seats: 1
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/bookings', () => {
    it('should return all bookings', async () => {
      const response = await request(app).get('/api/bookings');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.bookings)).toBe(true);
    });
  });

  describe('POST /api/bookings/:id/cancel', () => {
    it('should cancel booking', async () => {
      // First create a booking
      const bookingResponse = await request(app)
        .post('/api/book')
        .send({
          busId: 1,
          passengerName: 'Test User',
          email: 'test@example.com',
          seats: 1
        });

      const bookingId = bookingResponse.body.booking.id;

      const response = await request(app)
        .post(`/api/bookings/${bookingId}/cancel`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 404 for invalid booking', async () => {
      const response = await request(app)
        .post('/api/bookings/999/cancel');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/admin/stats', () => {
    it('should return statistics', async () => {
      const response = await request(app).get('/api/admin/stats');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalBookings');
      expect(response.body).toHaveProperty('totalRevenue');
    });
  });

  describe('Error handling', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/unknown-route');
      expect(response.status).toBe(404);
    });

    it('should handle health check', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('OK');
    });
  });
});
