const errorHandler = (err, req, res, next) => {
  console.error('Error detectado:', err.stack || err.message);

  const statusCode = err.status || err.statusCode || 500;

  res.status(statusCode).json({
    status: statusCode,
    error: err.name || 'Internal Server Error',
    message: err.message || 'Ocurrió un error inesperado en el servidor.'
  });
};

module.exports = errorHandler;