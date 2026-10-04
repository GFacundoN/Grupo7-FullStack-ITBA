const notFound = (req, res, next) => {
  res.status(404).json({
    status: 404,
    error: 'Not Found',
    message: `La ruta '${req.originalUrl}' no existe en este servidor.`
  });
};

module.exports = notFound;