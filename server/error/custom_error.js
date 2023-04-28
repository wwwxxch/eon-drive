class customError extends Error {
  constructor(message, status) {
    super(message);
    this.name = this.constructor.name;
    this.status = status || 500;
    Error.captureStackTrace(this, this.constructor);
  }
  static badRequest(message) {
    return new customError(message || "Bad Request", 400);
  }
  static unauthorized(message) {
    return new customError(message || "Unauthorized", 401);
  }
  static forbidden(message) {
    return new customError(message || "Forbidden", 403);
  }
  static notFound(message) {
    return new customError(message || "Not found", 404);
  }
  static internalServerError(message) {
    return new customError(message || "Something wrong", 500);
  }
}

export { customError };
