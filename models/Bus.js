/**
 * Bus model representing a bus entity
 */
class Bus {
  constructor(id, number, from, to, departure, arrival, price, seats, availableSeats) {
    this.id = id;
    this.number = number;
    this.from = from;
    this.to = to;
    this.departure = departure;
    this.arrival = arrival;
    this.price = price;
    this.seats = seats;
    this.availableSeats = availableSeats;
  }

  /**
   * Check if bus has available seats
   * @returns {boolean} True if seats are available
   */
  hasAvailableSeats() {
    return this.availableSeats > 0;
  }

  /**
   * Book a seat on the bus
   * @returns {boolean} True if booking was successful
   */
  bookSeat() {
    if (this.hasAvailableSeats()) {
      this.availableSeats -= 1;
      return true;
    }
    return false;
  }

  /**
   * Get bus information as JSON
   * @returns {Object} Bus data
   */
  toJSON() {
    return {
      id: this.id,
      number: this.number,
      from: this.from,
      to: this.to,
      departure: this.departure,
      arrival: this.arrival,
      price: this.price,
      seats: this.seats,
      availableSeats: this.availableSeats
    };
  }
}

module.exports = Bus;
