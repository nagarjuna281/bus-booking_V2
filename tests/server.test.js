const request = require('supertest');
const app = require('../src/server');

describe('Bus Booking API V2', () => {
  describe('GET /api/buses', () => {
    it('should return all buses with enhanced filtering', async () => {
      const response = await request(app).get('/api/buses');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('buses');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.buses)).toBe(true);
    });

    it('should filter buses by type', async () => {
      const response = await request(app)
        .get('/api/buses?type=AC Sleeper');
      
      expect(response.status).toBe(200);
      expect(response.body.buses.every(bus => 
        bus.type === 'AC Sleeper'
      )).toBe(true);
    });

    it('should sort buses by price', async () => {
      const response = await request(app)
        .get('/api/buses?sortBy=price');
      
      expect(response.status).toBe(200);
      const prices = response.body.buses.map(bus => bus.price);
      const sortedPrices = [...prices].sort((a, b) => a - b);
      expect(prices).toEqual(sortedPrices);
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
    });
  });

  describe('GET /api/bookings', () => {
    it('should return all bookings', async () => {
      const response = await request(app).get('/api/bookings');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('bookings');
      expect(response.body).toHaveProperty('total');
    });

    it('should filter bookings by email', async () => {
      const response = await request(app)
        .get('/api/bookings?email=john@example.com');
      
      expect(response.status).toBe(200);
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

      const bookingId = bookingResponse.body.booking.id;

      const response = await request(app)
        .post(`/api/bookings/${bookingId}/cancel`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/admin/stats', () => {
    it('should return admin statistics', async () => {
      const response = await request(app).get('/api/admin/stats');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalBookings');
      expect(response.body).toHaveProperty('totalRevenue');
      expect(response.body).toHaveProperty('totalBuses');
    });
  });
});
