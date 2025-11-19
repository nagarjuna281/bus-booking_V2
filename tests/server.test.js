const request = require('supertest');
const { app, busData } = require('../src/server');

describe('Bus Booking API', () => {
  beforeEach(() => {
    busData.buses = [
      {
        id: 1,
        name: 'Test Bus',
        from: 'New York',
        to: 'Boston',
        departure: '08:00 AM',
        arrival: '12:00 PM',
        price: 45,
        seats: 40,
        available: 35,
        type: 'AC Sleeper',
        amenities: ['WiFi'],
        duration: '4h',
        operator: 'Test Operator',
      },
    ];
    busData.bookings = [];
  });

  describe('GET /api/buses', () => {
    it('should return all buses', async () => {
      const response = await request(app).get('/api/buses');
      expect(response.status).toBe(200);
      expect(response.body.buses).toHaveLength(1);
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('OK');
    });
  });

  describe('POST /api/book', () => {
    it('should create booking with valid data', async () => {
      const bookingData = {
        busId: 1,
        passengerName: 'John Doe',
        email: 'john@example.com',
        seats: 2,
      };

      const response = await request(app)
        .post('/api/book')
        .send(bookingData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject invalid email', async () => {
      const response = await request(app)
        .post('/api/book')
        .send({
          busId: 1,
          passengerName: 'John',
          email: 'invalid-email',
          seats: 1,
        });

      expect(response.status).toBe(400);
    });
  });
});
