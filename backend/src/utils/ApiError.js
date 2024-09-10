//  making a seperate error handler to send errors in some format..

class ApiError extends Error {
  constructor(
    statusCode,
    messege = "Something went wrong!",
    errors = [],
    stack = ""
  ) {
    super(messege);
    this.statusCode = statusCode;
    this.success = false;
    this.data = null;
    this.message = messege;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export { ApiError };
