/**
 * Validation middleware for bus search
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const validateBusSearch = (req, res, next) => {
  const { from, to, date } = req.query;
  const errors = [];

  // Validate 'from' parameter
  if (!from || typeof from !== 'string' || from.trim().length === 0) {
    errors.push('Departure city (from) is required and must be a non-empty string');
  }

  // Validate 'to' parameter
  if (!to || typeof to !== 'string' || to.trim().length === 0) {
    errors.push('Destination city (to) is required and must be a non-empty string');
  }

  // Validate 'date' parameter
  if (date) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      errors.push('Date must be in YYYY-MM-DD format');
    } else {
      const inputDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (inputDate < today) {
        errors.push('Date cannot be in the past');
      }
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      messages: errors
    });
  }

  // Sanitize inputs
  req.query.from = from.trim();
  req.query.to = to.trim();
  
  if (date) {
    req.query.date = date.trim();
  }

  next();
};

module.exports = {
  validateBusSearch
};
