import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';

import authRoutes from './routes/auth.js';
import meRoutes from './routes/me.js';
import registerRoutes from "./routes/register.js"
import { requireAuth } from './middleware/auth.js';
import { allowRoles } from './middleware/roleGuard.js';

//rate limiting
import rateLimit from 'express-rate-limit';
const app = express();

app.use(helmet());
app.use(express.json());
app.use(morgan('dev'));

app.use(express.urlencoded({ extended: false }));

app.use(
  cors({
    origin: "*", 
    credentials: true,         
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "x-api-key"],
  })
);

const limiter = rateLimit({
windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60000),
max: Number(process.env.RATE_LIMIT_MAX || 100),
standardHeaders: true,
legacyHeaders: false,
});
app.use(limiter);

// Health
app.get('/health', (_req, res) => res.json({ ok: true }));

// Auth
app.use('/auth', authRoutes);
//register auth
app.use("/register", registerRoutes);
// Me
app.use('/', meRoutes);

// Example protected route with role guard scaffolding
app.get('/admin/ping', requireAuth, allowRoles('Admin'), (req, res) => {
  res.json({ ok: true, msg: 'admin pong', tenantId: req.user.tenantId });
});

export default app;
