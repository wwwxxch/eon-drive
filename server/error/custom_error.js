class CustomError extends Error {
  constructor(message, status) {
    super(message);
    this.name = this.constructor.name;
    this.status = status || 500;
    Error.captureStackTrace(this, this.constructor);
  }
  static badRequest(message) {
    return new CustomError(message || "Bad Request", 400);
  }
  static unauthorized(message) {
    return new CustomError(message || "Unauthorized", 401);
  }
  static forbidden(message) {
    return new CustomError(message || "Forbidden", 403);
  }
  static notFound(message) {
    return new CustomError(message || "Not found", 404);
  }
  static internalServerError(message) {
    return new CustomError(message || "Something wrong", 500);
  }
}

export { CustomError };
