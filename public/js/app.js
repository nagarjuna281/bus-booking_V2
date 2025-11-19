/**
 * BusBooker V2 Frontend Application
 */
class BusBookerApp {
  constructor() {
    this.initializeApp();
  }

  /**
   * Initialize the application
   */
  initializeApp() {
    this.bindEvents();
    this.setMinDate();
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
      searchForm.addEventListener('submit', (e) => this.handleSearch(e));
    }
  }

  /**
   * Set minimum date for date input to today
   */
  setMinDate() {
    const dateInput = document.getElementById('date');
    if (dateInput) {
      const today = new Date().toISOString().split('T')[0];
      dateInput.setAttribute('min', today);
      
      // Set default value to today
      dateInput.value = today;
    }
  }

  /**
   * Handle search form submission
   * @param {Event} e - Form submit event
   */
  async handleSearch(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const searchParams = {
      from: formData.get('from'),
      to: formData.get('to'),
      date: formData.get('date')
    };

    // Basic client-side validation
    if (!this.validateSearchParams(searchParams)) {
      return;
    }

    await this.performSearch(searchParams);
  }

  /**
   * Validate search parameters
   * @param {Object} params - Search parameters
   * @returns {boolean} True if valid
   */
  validateSearchParams(params) {
    const errors = [];

    if (!params.from || params.from.trim().length === 0) {
      errors.push('Departure city is required');
    }

    if (!params.to || params.to.trim().length === 0) {
      errors.push('Destination city is required');
    }

    if (params.from && params.to && params.from.toLowerCase() === params.to.toLowerCase()) {
      errors.push('Departure and destination cities cannot be the same');
    }

    if (errors.length > 0) {
      this.showError(errors.join(', '));
      return false;
    }

    return true;
  }

  /**
   * Perform bus search
   * @param {Object} params - Search parameters
   */
  async performSearch(params) {
    try {
      this.showLoading();
      
      const queryString = new URLSearchParams(params).toString();
      const response = await fetch(`/api/buses/search?${queryString}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Search failed');
      }

      const data = await response.json();
      this.displayResults(data);
      
    } catch (error) {
      console.error('Search error:', error);
      this.showError(error.message || 'Failed to search for buses. Please try again.');
    }
  }

  /**
   * Display search results
   * @param {Object} data - Search results data
   */
  displayResults(data) {
    this.hideError();
    this.hideLoading();

    const resultsSection = document.getElementById('results');
    const resultsContainer = document.getElementById('resultsContainer');

    if (!data.buses || data.buses.length === 0) {
      this.showError('No buses found for your search criteria');
      resultsSection.style.display = 'none';
      return;
    }

    resultsContainer.innerHTML = data.buses.map(bus => this.createBusCard(bus)).join('');
    resultsSection.style.display = 'block';

    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth' });
  }

  /**
   * Create bus card HTML
   * @param {Object} bus - Bus data
   * @returns {string} HTML string
   */
  createBusCard(bus) {
    return `
      <div class="bus-card">
        <div class="bus-header">
          <span class="bus-number">${bus.number}</span>
          <span class="bus-route">${bus.from} → ${bus.to}</span>
        </div>
        <div class="bus-details">
          <div class="detail-item">
            <span class="detail-label">Departure</span>
            <span class="detail-value">${bus.departure}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Arrival</span>
            <span class="detail-value">${bus.arrival}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Available Seats</span>
            <span class="detail-value">${bus.availableSeats} / ${bus.seats}</span>
          </div>
        </div>
        <div class="price">$${bus.price.toFixed(2)}</div>
      </div>
    `;
  }

  /**
   * Show error message
   * @param {string} message - Error message
   */
  showError(message) {
    this.hideResults();
    this.hideLoading();

    const errorSection = document.getElementById('error');
    const errorMessage = document.getElementById('errorMessage');

    if (errorSection && errorMessage) {
      errorMessage.textContent = message;
      errorSection.style.display = 'block';
      errorSection.scrollIntoView({ behavior: 'smooth' });
    }
  }

  /**
   * Hide error message
   */
  hideError() {
    const errorSection = document.getElementById('error');
    if (errorSection) {
      errorSection.style.display = 'none';
    }
  }

  /**
   * Hide results section
   */
  hideResults() {
    const resultsSection = document.getElementById('results');
    if (resultsSection) {
      resultsSection.style.display = 'none';
    }
  }

  /**
   * Show loading state
   */
  showLoading() {
    // In a real app, you might show a loading spinner
    const submitButton = document.querySelector('#searchForm button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Searching...';
    }
  }

  /**
   * Hide loading state
   */
  hideLoading() {
    const submitButton = document.querySelector('#searchForm button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = 'Search Buses';
    }
  }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new BusBookerApp();
});
