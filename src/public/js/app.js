class BusBookingApp {
  constructor() {
    this.init();
  }

  init() {
    this.loadBuses();
  }

  async loadBuses() {
    try {
      const response = await fetch('/api/buses');
      const data = await response.json();
      this.displayBuses(data.buses);
    } catch (error) {
      console.error('Failed to load buses:', error);
    }
  }

  displayBuses(buses) {
    const container = document.getElementById('busesContainer');
    if (!container) return;

    container.innerHTML = buses.map(bus => `
      <div class="bus-card">
        <div class="bus-header">
          <strong>${bus.from} → ${bus.to}</strong>
          <span>$${bus.price}</span>
        </div>
        <p>${bus.name} - ${bus.available} seats available</p>
        <button onclick="alert('Booking ${bus.name}')">Book Now</button>
      </div>
    `).join('');
  }
}

// Start app
const app = new BusBookingApp();
