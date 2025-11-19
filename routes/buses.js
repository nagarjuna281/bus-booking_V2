const express = require('express');
const { validateBusSearch } = require('../middleware/validation');
const Bus = require('../models/Bus');

const router = express.Router();

// Sample bus data (in production, this would come from a database)
const sampleBuses = [
  {
    id: 'BUS001',
    number: 'BB-001',
    from: 'New York',
    to: 'Boston',
    departure: '08:00',
    arrival: '12:00',
    price: 45.50,
    seats: 40,
    availableSeats: 25
  },
  {
    id: 'BUS002',
    number: 'BB-002',
    from: 'New York',
    to: 'Washington DC',
    departure: '09:30',
    arrival: '14:00',
    price: 55.75,
    seats: 40,
    availableSeats: 15
  }
];

/**
 * Search for buses between two cities
 * @route GET /api/buses/search
 * @param {string} from - Departure city
 * @param {string} to - Destination city
 * @param {string} date - Travel date (YYYY-MM-DD)
 * @returns {Object[]} List of available buses
 */
router.get('/search', validateBusSearch, (req, res) => {
  const { from, to, date } = req.query;
  
  try {
    const filteredBuses = sampleBuses.filter(bus => 
      bus.from.toLowerCase() === from.toLowerCase() && 
      bus.to.toLowerCase() === to.toLowerCase()
    );

    if (filteredBuses.length === 0) {
      return res.status(404).json({
        error: 'No buses found',
        message: `No buses available from ${from} to ${to}`
      });
    }

    res.json({
      success: true,
      count: filteredBuses.length,
      date,
      buses: filteredBuses
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      error: 'Search failed',
      message: 'Unable to search for buses'
    });
  }
});

/**
 * Get bus details by ID
 * @route GET /api/buses/:id
 * @param {string} id - Bus ID
 * @returns {Object} Bus details
 */
router.get('/:id', (req, res) => {
  const busId = req.params.id;
  const bus = sampleBuses.find(b => b.id === busId);

  if (!bus) {
    return res.status(404).json({
      error: 'Bus not found',
      message: `Bus with ID ${busId} does not exist`
    });
  }

  res.json({
    success: true,
    bus
  });
});

/**
 * Get all available buses
 * @route GET /api/buses
 * @returns {Object[]} All buses
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    count: sampleBuses.length,
    buses: sampleBuses
  });
});

module.exports = router;
