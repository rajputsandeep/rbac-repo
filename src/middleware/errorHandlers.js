import { HttpError } from '../utils/httpErrors.js';


export const notFound = (req, res, next) => {
next(new HttpError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};


export const errorHandler = (err, req, res, next) => { // eslint-disable-line
const status = err instanceof HttpError ? err.status : 500;
const message = err.message || 'Internal Server Error';
const details = err.details || undefined;
res.status(status).json({ error: { message, details } });
};