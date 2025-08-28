// Role guard scaffolding. Usage: app.get('/admin', requireAuth, allowRoles('Admin'), handler)
export function allowRoles(...allowed) {
  const set = new Set(allowed.map((r) => r.toLowerCase()));
  return (req, res, next) => {
    const role = (req.user?.role || '').toLowerCase();
    if (!role || !set.has(role)) {
      return res.status(403).json({ error: 'Forbidden: insufficient role' });
    }
    next();
  };
}
