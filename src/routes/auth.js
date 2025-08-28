import express from "express";
import { z } from "zod";
import { signJwt } from "../services/jwt.js";
import { findAuthSubject } from "../services/auth.js";
import { AppDataSource } from "../dataSource/data-source.js";

const router = express.Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

router.post("/login", async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: "Invalid payload", details: parsed.error.flatten() });
    }
    const { email, password } = parsed.data;

    // DB-first auth (async)
    const subject = await findAuthSubject(email, password); // { id, email, type, tenantId?, userName? }
    if (!subject) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Build JWT payload
    const payload = {
      sub: subject.id,                  // userId or 'superadmin' / tenant id
      email: subject.email,
      role: subject.type,               // 'superAdmin' | 'tenant' | 'Admin' | 'Agent' | ...
      tenantId: subject.tenantId ?? null, // superAdmin/tenant can be null
    };
    const token = signJwt(payload);

    // OPTIONAL: update last login metadata in DB for app_user logins
    try {
      if (subject.type !== "tenant") {
        await AppDataSource
          .createQueryBuilder()
          .update("app_user")
          .set({
            last_login_at: () => "NOW()",
            last_login_ip:
              (req.headers["x-forwarded-for"]?.toString().split(",")[0] || req.ip) ?? null,
            last_login_user_agent: req.get("user-agent") || null,
          })
          .where(`"userId" = :uid`, { uid: subject.id })
          .execute();

        // increment login_count (if column exists)
        await AppDataSource
          .createQueryBuilder()
          .update("app_user")
          .set({ login_count: () => "COALESCE(login_count,0) + 1" })
          .where(`"userId" = :uid`, { uid: subject.id })
          .execute();
      }
    } catch (metaErr) {
      // ignore if columns not present
      console.warn("login metadata update skipped:", metaErr.message || metaErr);
    }

    // Response
    return res.json({
      token,
      payload, // echo useful claims
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
