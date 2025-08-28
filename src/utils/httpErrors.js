export class HttpError extends Error {
constructor(status, message, details) {
super(message);
this.status = status;
this.details = details;
}
}
export const BadRequest = (msg = 'Bad Request', details) => new HttpError(400, msg, details);
export const Unauthorized = (msg = 'Unauthorized', details) => new HttpError(401, msg, details);
export const Forbidden = (msg = 'Forbidden', details) => new HttpError(403, msg, details);
export const NotFound = (msg = 'Not Found', details) => new HttpError(404, msg, details);