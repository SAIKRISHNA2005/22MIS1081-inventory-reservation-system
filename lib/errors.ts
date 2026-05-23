export class InsufficientStockError extends Error {
  readonly statusCode = 409;
  constructor() {
    super("Insufficient stock available");
    this.name = "InsufficientStockError";
  }
}

export class ReservationNotFoundError extends Error {
  readonly statusCode = 404;
  constructor() {
    super("Reservation not found");
    this.name = "ReservationNotFoundError";
  }
}

export class ReservationExpiredError extends Error {
  readonly statusCode = 410;
  constructor() {
    super("Reservation has expired");
    this.name = "ReservationExpiredError";
  }
}

export class ReservationAlreadyProcessedError extends Error {
  readonly statusCode = 409;
  constructor(status: string) {
    super(`Reservation is already ${status}`);
    this.name = "ReservationAlreadyProcessedError";
  }
}
