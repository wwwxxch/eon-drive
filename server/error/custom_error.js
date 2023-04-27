class customError extends Error {
  constructor(message, status) {
    super(message);
    this.name = this.constructor.name;
    this.status = status || 500;
    Error.captureStackTrace(this, this.constructor);
  }
}

class notFoundError extends customError {
  constructor(message = "The page you requested is not existed.") {
    super(message, 404);
  }
}

export { customError, notFoundError };