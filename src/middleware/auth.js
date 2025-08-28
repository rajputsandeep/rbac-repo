import { verifyJwt } from '../services/jwt.js';
import { config } from '../config.js';

export function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing Bearer token' });
  }

  try {
    const decoded = verifyJwt(token);
    // decoded payload => { sub, email, role, tenantId }
    req.user = decoded;

    const role = (decoded.role || '').toLowerCase();

    // Super Admin, Admin and Tenant (tenant spelling) skip
    const skipTenantHeader =
      role === 'superadmin' ||
      role === 'admin' ||
      role === 'tenant' 

    if (config.enforceTenantHeader && !skipTenantHeader) {
      const tenantHeader = req.headers['x-tenant-id'];

      if (!tenantHeader) {
        return res
          .status(403)
          .json({ error: 'Tenant header required. Provide X-Tenant-Id.' });
      }
      if (!decoded.tenantId) {
        return res
          .status(403)
          .json({ error: 'Token missing tenant scope.' });
      }
      if (tenantHeader !== decoded.tenantId) {
        return res
          .status(403)
          .json({ error: 'Tenant mismatch. Provide correct X-Tenant-Id header.' });
      }
    }

    // convenience: req.tenantId set  (header > token fallback)
    req.tenantId = req.headers['x-tenant-id'] || decoded.tenantId || null;

    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
