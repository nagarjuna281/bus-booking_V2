class BusBookingApp {
  constructor() {
    this.currentBus = null;
    this.init();
  }

  init() {
    this.bindEvents();
    this.loadAllBuses();
    this.loadStats();
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
      const data = await response.json();
      
      if (data.buses) {
        this.displayBuses(data.buses);
      }
    } catch (error) {
      this.showError('Failed to load buses');
    }
  }

  async searchBuses() {
    const fromInput = document.getElementById('fromInput');
    const toInput = document.getElementById('toInput');
    const typeFilter = document.getElementById('typeFilter');
    const minPrice = document.getElementById('minPrice');
    const maxPrice = document.getElementById('maxPrice');
    const sortBy = document.getElementById('sortBy');
    
    const params = new URLSearchParams();
    
    if (fromInput && fromInput.value.trim()) params.append('from', fromInput.value.trim());
    if (toInput && toInput.value.trim()) params.append('to', toInput.value.trim());
    if (typeFilter && typeFilter.value) params.append('type', typeFilter.value);
    if (minPrice && minPrice.value) params.append('minPrice', minPrice.value);
    if (maxPrice && maxPrice.value) params.append('maxPrice', maxPrice.value);
    if (sortBy && sortBy.value) params.append('sortBy', sortBy.value);

    const url = `/api/buses${params.toString() ? `?${params.toString()}` : ''}`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to search buses');
      }
      
      this.displayBuses(data.buses);
    } catch (error) {
      this.showError(error.message);
    }
  }

  displayBuses(buses) {
    const busesList = document.getElementById('busesList');
    
    if (!busesList) return;

    if (buses.length === 0) {
      busesList.innerHTML = '<p class="no-buses">No buses found matching your criteria.</p>';
      return;
    }

    busesList.innerHTML = buses.map(bus => `
      <div class="bus-card" data-bus-id="${bus.id}">
        <div class="bus-header">
          <span class="bus-route">${bus.from} → ${bus.to}</span>
          <span class="bus-price">$${bus.price}</span>
        </div>
        <div class="bus-details">
          <div>
            <strong>Departure:</strong> ${bus.departure}
          </div>
          <div>
            <strong>Arrival:</strong> ${bus.arrival}
          </div>
          <div>
            <strong>Duration:</strong> ${bus.duration}
          </div>
          <div>
            <strong>Available:</strong> ${bus.available} seats
          </div>
          <div>
            <strong>Type:</strong> ${bus.type}
          </div>
          <div>
            <strong>Operator:</strong> ${bus.operator}
          </div>
        </div>
        ${bus.amenities && bus.amenities.length > 0 ? `
          <div class="bus-amenities">
            ${bus.amenities.map(amenity => `<span class="amenity-tag">${amenity}</span>`).join('')}
          </div>
        ` : ''}
        <button class="book-btn" onclick="app.selectBus(${bus.id})">
          Book Now
        </button>
      </div>
    `).join('');
  }

  async selectBus(busId) {
    try {
      const response = await fetch(`/api/buses/${busId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load bus details');
      }
      
      this.currentBus = busId;
      this.showBookingForm(data.bus);
    } catch (error) {
      this.showError(error.message);
    }
  }

  showBookingForm(bus) {
    const bookingForm = document.getElementById('bookingForm');
    const selectedBusId = document.getElementById('selectedBusId');
    
    if (bookingForm && selectedBusId) {
      selectedBusId.value = bus.id;
      bookingForm.classList.remove('hidden');
      bookingForm.scrollIntoView({ behavior: 'smooth' });
    }
  }

  async handleBooking(event) {
    event.preventDefault();
    
    const passengerName = document.getElementById('passengerName');
    const email = document.getElementById('email');
    const seats = document.getElementById('seats');
    const paymentMethod = document.getElementById('paymentMethod');
    const selectedBusId = document.getElementById('selectedBusId');
    
    if (!passengerName || !email || !seats || !selectedBusId) {
      this.showError('Please fill all required fields');
      return;
    }

    const bookingData = {
      busId: this.currentBus,
      passengerName: passengerName.value.trim(),
      email: email.value.trim(),
      seats: parseInt(seats.value, 10),
      paymentMethod: paymentMethod ? paymentMethod.value : 'credit_card'
    };

    // Validation
    if (!bookingData.passengerName) {
      this.showError('Please enter passenger name');
      return;
    }

    if (!this.isValidEmail(bookingData.email)) {
      this.showError('Please enter a valid email address');
      return;
    }

    if (bookingData.seats < 1 || bookingData.seats > 10) {
      this.showError('Please select between 1-10 seats');
      return;
    }

    try {
      const response = await fetch('/api/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookingData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Booking failed');
      }

      this.showBookingResult(result);
      
      // Reset form
      event.target.reset();
      
      // Reload buses to update availability
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
          <p><strong>Email:</strong> ${result.booking.email}</p>
          <p><strong>Seats:</strong> ${result.booking.seats}</p>
          <p><strong>Total Price:</strong> $${result.booking.totalPrice}</p>
          <p><strong>Payment Method:</strong> ${result.booking.paymentMethod}</p>
          <p>${result.message}</p>
        </div>
      `;
      bookingResult.classList.remove('hidden');
      bookingResult.scrollIntoView({ behavior: 'smooth' });
    }
  }

  async loadStats() {
    try {
      const response = await fetch('/health');
      const data = await response.json();
      
      if (data.stats) {
        this.displayStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }

  displayStats(stats) {
    const statsContainer = document.getElementById('statsContainer');
    
    if (statsContainer) {
      statsContainer.innerHTML = `
        <div class="stat-card">
          <span class="stat-number">${stats.totalBuses}</span>
          <span class="stat-label">Total Buses</span>
        </div>
        <div class="stat-card">
          <span class="stat-number">${stats.totalBookings}</span>
          <span class="stat-label">Total Bookings</span>
        </div>
        <div class="stat-card">
          <span class="stat-number">${stats.availableSeats}</span>
          <span class="stat-label">Available Seats</span>
        </div>
      `;
    }
  }

  async loadAdminStats() {
    try {
      const response = await fetch('/api/admin/stats');
      const data = await response.json();
      
      this.displayAdminStats(data);
    } catch (error) {
      this.showError('Failed to load admin stats');
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
          <span class="admin-stat-number">${stats.confirmedBookings}</span>
          <span class="admin-stat-label">Confirmed Bookings</span>
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

  async searchBookings() {
    const searchEmail = document.getElementById('searchEmail');
    
    if (!searchEmail || !searchEmail.value.trim()) {
      this.loadAllBookings();
      return;
    }

    try {
      const response = await fetch(`/api/bookings?email=${encodeURIComponent(searchEmail.value.trim())}`);
      const data = await response.json();
      
      this.displayBookings(data.bookings);
    } catch (error) {
      this.showError('Failed to search bookings');
    }
  }

  displayBookings(bookings) {
    const bookingsList = document.getElementById('bookingsList');
    
    if (!bookingsList) return;

    if (bookings.length === 0) {
      bookingsList.innerHTML = '<p class="no-bookings">No bookings found.</p>';
      return;
    }

    bookingsList.innerHTML = bookings.map(booking => `
      <div class="booking-card ${booking.status === 'cancelled' ? 'cancelled' : ''}">
        <div class="booking-header">
          <span class="booking-pnr">${booking.pnr}</span>
          <span class="booking-status status-${booking.status}">${booking.status.toUpperCase()}</span>
        </div>
        <div class="booking-details">
          <p><strong>Passenger:</strong> ${booking.passengerName}</p>
          <p><strong>Email:</strong> ${booking.email}</p>
          <p><strong>Seats:</strong> ${booking.seats}</p>
          <p><strong>Total Price:</strong> $${booking.totalPrice}</p>
          <p><strong>Booking Date:</strong> ${new Date(booking.bookingDate).toLocaleDateString()}</p>
          <p><strong>Payment Method:</strong> ${booking.paymentMethod}</p>
        </div>
        ${booking.status === 'confirmed' ? `
          <button class="cancel-btn" onclick="app.cancelBooking(${booking.id})">
            Cancel Booking
          </button>
        ` : ''}
      </div>
    `).join('');
  }

  async cancelBooking(bookingId) {
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST'
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Cancellation failed');
      }

      alert('Booking cancelled successfully!');
      this.loadAllBookings();
      this.loadAdminStats();
    } catch (error) {
      this.showError(error.message);
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
      bookingResult.scrollIntoView({ behavior: 'smooth' });
    } else {
      alert(`Error: ${message}`);
    }
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

// Initialize app
const app = new BusBookingApp();
