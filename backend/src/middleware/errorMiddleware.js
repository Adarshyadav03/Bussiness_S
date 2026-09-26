function errorHandler(err, req, res, next) {
  if (process.env.NODE_ENV !== 'test') {
    console.error('Error handling request:', err);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const errorCode = err.errorCode || 'INTERNAL_SERVER_ERROR';

  res.status(statusCode).json({
    success: false,
    message,
    error: errorCode,
  });
}

module.exports = { errorHandler };
