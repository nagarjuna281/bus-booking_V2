class BusBookingApp {
  constructor() {
    this.currentBus = null;
    this.init();
  }

  init() {
    this.loadBuses();
  }

  async loadBuses() {
    try {
      const response = await fetch('/api/buses');
      const data = await response.json();
      
      if (data.success) {
        this.displayBuses(data.buses);
      } else {
        this.showError('Failed to load buses');
      }
    } catch (error) {
      this.showError('Network error loading buses');
    }
  }

  displayBuses(buses) {
    const container = document.getElementById('busesContainer');
    if (!container) return;

    if (buses.length === 0) {
      container.innerHTML = '<p>No buses available.</p>';
      return;
    }

    container.innerHTML = buses.map(bus => `
      <div class="bus-card">
        <div class="bus-header">
          <span class="bus-route">${bus.from} → ${bus.to}</span>
          <span class="bus-price">$${bus.price}</span>
        </div>
        <div class="bus-details">
          <div><strong>Departure:</strong> ${bus.departure}</div>
          <div><strong>Arrival:</strong> ${bus.arrival}</div>
          <div><strong>Available:</strong> ${bus.available} seats</div>
          <div><strong>Type:</strong> ${bus.type}</div>
        </div>
        <button class="book-btn" onclick="app.selectBus(${bus.id})">
          Book Now
        </button>
      </div>
    `).join('');
  }

  selectBus(busId) {
    this.currentBus = busId;
    this.showBookingForm();
  }

  showBookingForm() {
    const form = document.getElementById('bookingForm');
    if (form) {
      form.classList.remove('hidden');
      form.scrollIntoView({ behavior: 'smooth' });
    }
  }

  async bookBus(event) {
    event.preventDefault();
    
    const passengerName = document.getElementById('passengerName').value.trim();
    const email = document.getElementById('email').value.trim();
    const seats = document.getElementById('seats').value;

    if (!passengerName || !email || !seats) {
      this.showError('Please fill all fields');
      return;
    }

    const bookingData = {
      busId: this.currentBus,
      passengerName,
      email,
      seats: parseInt(seats, 10)
    };

    try {
      const response = await fetch('/api/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookingData)
      });

      const result = await response.json();
      
      if (result.success) {
        this.showSuccess(result.message);
        event.target.reset();
        this.loadBuses(); // Refresh bus availability
      } else {
        this.showError(result.error);
      }
    } catch (error) {
      this.showError('Network error during booking');
    }
  }

  showSuccess(message) {
    this.showMessage(message, 'success');
  }

  showError(message) {
    this.showMessage(message, 'error');
  }

  showMessage(message, type) {
    const resultDiv = document.getElementById('bookingResult');
    if (resultDiv) {
      resultDiv.innerHTML = `
        <div class="booking-result ${type}">
          ${message}
        </div>
      `;
      resultDiv.classList.remove('hidden');
    }
  }
}

// Initialize app
const app = new BusBookingApp();
