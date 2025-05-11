class CustomError extends Error {
    constructor(message, status) {
      super(message);
      this.status = status;
      this.name = 'CustomError';
    }
  }
  
  module.exports = { CustomError };