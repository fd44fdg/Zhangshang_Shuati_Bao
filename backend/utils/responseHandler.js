const sendSuccess = (res, data, message = 'Success', statusCode = 200) => {
  res.status(statusCode).json({
    code: statusCode, // 使用标准HTTP状态码，不要乘以100
    message,
    data,
    success: true,
  });
};

const sendError = (res, error) => {
  const statusCode = error.statusCode || 500;

  // For operational errors, we send a clear message to the client.
  // For programming or other unknown errors, we don't leak error details.
  const response = {
    code: statusCode, // 使用标准HTTP状态码
    message: error.isOperational ? error.message : 'Internal Server Error',
    success: false,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  };

  res.status(statusCode).json(response);
};

module.exports = {
  sendSuccess,
  sendError,
}; 