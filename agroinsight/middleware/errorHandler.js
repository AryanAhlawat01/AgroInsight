// middleware/errorHandler.js

// 404 handler — attach after all routes
const notFound = (req, res, next) => {
  res.status(404).json({ success: false, error: `Route not found: ${req.originalUrl}` });
};

// Global error handler
const errorHandler = (err, req, res, next) => {
  const status = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' && status === 500
    ? 'Internal server error'
    : err.message;

  console.error(`[${new Date().toISOString()}] ${status} ${req.method} ${req.path} — ${err.message}`);

  res.status(status).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

module.exports = { notFound, errorHandler };
