import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export function signJwt(payload, options = {}) {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn, ...options });
}

export function verifyJwt(token) {
  return jwt.verify(token, config.jwtSecret);
}
