class BusBookingApp {
  constructor() {
    this.currentBus = null;
    this.init();
  }

  init() {
    this.bindEvents();
    this.loadAllBuses();
  }

  bindEvents() {
    const searchBtn = document.getElementById('searchBtn');
    const bookForm = document.getElementById('bookForm');
    const refreshStats = document.getElementById('refreshStats');
    const viewAllBookings = document.getElementById('viewAllBookings');
    const searchBookingsBtn = document.getElementById('searchBookingsBtn');

    if (searchBtn) {
      searchBtn.addEventListener('click', () => this.searchBuses());
    }

    if (bookForm) {
      bookForm.addEventListener('submit', (e) => this.handleBooking(e));
    }

    if (refreshStats) {
      refreshStats.addEventListener('click', () => this.loadAdminStats());
    }

    if (viewAllBookings) {
      viewAllBookings.addEventListener('click', () => this.loadAllBookings());
    }

    if (searchBookingsBtn) {
      searchBookingsBtn.addEventListener('click', () => this.searchBookings());
    }
  }

  async loadAllBuses() {
    try {
      const response = await fetch('/api/buses');
      if (!response.ok) throw new Error('Failed to load buses');
      const data = await response.json();
      this.displayBuses(data.buses);
    } catch (error) {
      this.showError('Failed to load buses');
    }
  }

  async searchBuses() {
    try {
      const fromInput = document.getElementById('fromInput');
      const toInput = document.getElementById('toInput');
      const typeFilter = document.getElementById('typeFilter');

      const params = new URLSearchParams();
      if (fromInput?.value.trim()) params.append('from', fromInput.value.trim());
      if (toInput?.value.trim()) params.append('to', toInput.value.trim());
      if (typeFilter?.value) params.append('type', typeFilter.value);

      const url = `/api/buses${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      this.displayBuses(data.buses);
    } catch (error) {
      this.showError(error.message);
    }
  }

  displayBuses(buses) {
    const busesList = document.getElementById('busesList');
    if (!busesList) return;

    if (buses.length === 0) {
      busesList.innerHTML = '<p class="no-buses">No buses found.</p>';
      return;
    }

    busesList.innerHTML = buses.map(bus => `
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

  async selectBus(busId) {
    try {
      const response = await fetch(`/api/buses/${busId}`);
      if (!response.ok) throw new Error('Bus not found');
      const data = await response.json();
      this.currentBus = busId;
      this.showBookingForm(data.bus);
    } catch (error) {
      this.showError(error.message);
    }
  }

  showBookingForm() {
    const bookingForm = document.getElementById('bookingForm');
    const selectedBusId = document.getElementById('selectedBusId');
    if (bookingForm && selectedBusId) {
      selectedBusId.value = this.currentBus;
      bookingForm.classList.remove('hidden');
      bookingForm.scrollIntoView({ behavior: 'smooth' });
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
      seats: parseInt(seats.value, 10)
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
        body: JSON.stringify(bookingData)
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      this.showBookingResult(result);
      event.target.reset();
      this.loadAllBuses();
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
          <p><strong>Seats:</strong> ${result.booking.seats}</p>
          <p><strong>Total:</strong> $${result.booking.totalPrice}</p>
        </div>
      `;
      bookingResult.classList.remove('hidden');
    }
  }

  async loadAdminStats() {
    try {
      const response = await fetch('/api/admin/stats');
      const data = await response.json();
      this.displayAdminStats(data);
    } catch (error) {
      this.showError('Failed to load stats');
    }
  }

  displayAdminStats(stats) {
    const adminStats = document.getElementById('adminStats');
    if (adminStats) {
      adminStats.innerHTML = `
        <div class="admin-stat-card">
          <span class="admin-stat-number">${stats.totalBuses}</span>
          <span class="admin-stat-label">Total Buses</span>
        </div>
        <div class="admin-stat-card">
          <span class="admin-stat-number">${stats.totalBookings}</span>
          <span class="admin-stat-label">Total Bookings</span>
        </div>
        <div class="admin-stat-card">
          <span class="admin-stat-number">$${stats.totalRevenue}</span>
          <span class="admin-stat-label">Total Revenue</span>
        </div>
      `;
    }
  }

  async loadAllBookings() {
    try {
      const response = await fetch('/api/bookings');
      const data = await response.json();
      this.displayBookings(data.bookings);
    } catch (error) {
      this.showError('Failed to load bookings');
    }
  }

  displayBookings(bookings) {
    const bookingsList = document.getElementById('bookingsList');
    if (!bookingsList) return;

    if (bookings.length === 0) {
      bookingsList.innerHTML = '<p>No bookings found.</p>';
      return;
    }

    bookingsList.innerHTML = bookings.map(booking => `
      <div class="booking-card">
        <div class="booking-header">
          <span class="booking-pnr">${booking.pnr}</span>
          <span class="booking-status status-${booking.status}">
            ${booking.status.toUpperCase()}
          </span>
        </div>
        <p><strong>Passenger:</strong> ${booking.passengerName}</p>
        <p><strong>Seats:</strong> ${booking.seats}</p>
        <p><strong>Total:</strong> $${booking.totalPrice}</p>
      </div>
    `).join('');
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
    } else {
      alert(`Error: ${message}`);
    }
  }
}

// Initialize app
const app = new BusBookingApp();
