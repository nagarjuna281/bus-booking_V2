class BusBookingApp {
  constructor() {
    this.currentBus = null;
    this.init();
  }

  init() {
    this.bindEvents();
    this.loadBuses();
  }

  bindEvents() {
    const searchBtn = document.getElementById('searchBtn');
    const bookForm = document.getElementById('bookForm');

    if (searchBtn) {
      searchBtn.addEventListener('click', () => this.searchBuses());
    }

    if (bookForm) {
      bookForm.addEventListener('submit', (e) => this.handleBooking(e));
    }
  }

  async loadBuses() {
    try {
      const response = await fetch('/api/buses');
      if (!response.ok) {
        throw new Error('Failed to load buses');
      }
      const data = await response.json();
      this.displayBuses(data.buses);
    } catch (error) {
      this.showError('Failed to load buses');
    }
  }

  displayBuses(buses) {
    const container = document.getElementById('busesContainer');
    if (!container) return;

    if (buses.length === 0) {
      container.innerHTML = '<p>No buses found.</p>';
      return;
    }

    container.innerHTML = buses.map((bus) => `
      <div class="bus-card">
        <div class="bus-header">
          <strong>${bus.from} → ${bus.to}</strong>
          <span>$${bus.price}</span>
        </div>
        <p>${bus.name} - ${bus.available} seats available</p>
        <button class="book-btn" onclick="app.selectBus(${bus.id})">
          Book Now
        </button>
      </div>
    `).join('');
  }

  async selectBus(busId) {
    try {
      this.currentBus = busId;
      this.showBookingForm();
    } catch (error) {
      this.showError('Failed to select bus');
    }
  }

  showBookingForm() {
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
      bookingForm.classList.remove('hidden');
    }
  }

  async handleBooking(event) {
    event.preventDefault();
    
    const passengerName = document.getElementById('passengerName');
    const email = document.getElementById('email');
    const seats = document.getElementById('seats');

    if (!passengerName || !email || !seats) {
      this.showError('Please fill all fields');
      return;
    }

    const bookingData = {
      busId: this.currentBus,
      passengerName: passengerName.value.trim(),
      email: email.value.trim(),
      seats: parseInt(seats.value, 10),
    };

    // Validation
    if (!bookingData.passengerName) {
      this.showError('Please enter passenger name');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(bookingData.email)) {
      this.showError('Please enter valid email');
      return;
    }

    if (bookingData.seats < 1 || bookingData.seats > 10) {
      this.showError('Please select 1-10 seats');
      return;
    }

    try {
      const response = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error);
      }

      this.showBookingResult(result);
      event.target.reset();
    } catch (error) {
      this.showError(error.message);
    }
  }

  showBookingResult(result) {
    const bookingResult = document.getElementById('bookingResult');
    if (bookingResult) {
      bookingResult.innerHTML = `
        <div class="booking-result success">
          <h4>✅ Booking Confirmed!</h4>
          <p><strong>PNR:</strong> ${result.pnr}</p>
          <p><strong>Passenger:</strong> ${result.booking.passengerName}</p>
        </div>
      `;
      bookingResult.classList.remove('hidden');
    }
  }

  showError(message) {
    const bookingResult = document.getElementById('bookingResult');
    if (bookingResult) {
      bookingResult.innerHTML = `
        <div class="booking-result error">
          <strong>Error:</strong> ${message}
        </div>
      `;
      bookingResult.classList.remove('hidden');
    }
  }
}

// Initialize app
const app = new BusBookingApp();
