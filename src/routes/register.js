import express from "express";
import { AppDataSource } from "../dataSource/data-source.js";
import { requireAuth } from "../middleware/auth.js";
import { allowRoles } from "../middleware/roleGuard.js";

const router = express.Router();

const TenantRepo = () => AppDataSource.getRepository("TenantAccount");
const UserRepo   = () => AppDataSource.getRepository("AppUser");
const RoleRepo   = () => AppDataSource.getRepository("Role");

/** helpers */
async function getRoleOrThrow(id) {
  const r = await RoleRepo().findOne({ where: { id } });
  if (!r) throw new Error(`Role missing: ${id}`);
  return r;
}

async function findUserByEmailAndTenant(email, tenantIdNullable) {
  // tenantIdNullable can be null
  const qb = UserRepo()
    .createQueryBuilder("u")
    .leftJoinAndSelect("u.tenant", "t")
    .where("LOWER(u.email) = LOWER(:email)", { email });
  if (tenantIdNullable === null || typeof tenantIdNullable === "undefined") {
    qb.andWhere("u.tenant IS NULL");
  } else {
    qb.andWhere("t.id = :tid", { tid: tenantIdNullable });
  }
  return qb.getOne();
}

/** ======================
 * 1) SUPERADMIN → Create Tenant + TenantUser (bound)
 * ====================== */

// src/routes/register.js (add at bottom or separate file)
router.post(
  "/superadmin",
  async (req, res) => {
    try {
      const { email, password, userName } = req.body || {};
      if (!email || !password || !userName) {
        return res.status(400).json({ error: "email, password, userName are required" });
      }

      const UserRepo = AppDataSource.getRepository("AppUser");
      const RoleRepo = AppDataSource.getRepository("Role");

      // check role superadmin exists
      const roleSuper = await RoleRepo.findOne({ where: { id: "superadmin" } });
      if (!roleSuper) {
        return res.status(400).json({ error: "Role 'superadmin' not seeded yet" });
      }

      // check if superadmin already exists (tenant_id null)
      const existing = await UserRepo.createQueryBuilder("u")
        .where("LOWER(u.email) = LOWER(:email)", { email })
        .andWhere("u.tenant IS NULL")
        .getOne();
      if (existing) {
        return res.status(409).json({ error: "SuperAdmin with this email already exists" });
      }

      const newUser = UserRepo.create({
        userId: `u-superadmin-${Date.now()}`,
        password,
        userName,
        contactDetails: "",
        contactEmail: email,
        creationDate: new Date(),
        createdBy: "system",
        enabled: true,
        email,
        role: "superAdmin",
        roleRef: roleSuper,
        tenant: null   // 👈 superAdmin → no tenant
      });

      await UserRepo.save(newUser);

      return res.status(201).json({
        msg: "SuperAdmin created",
        user: {
          userId: newUser.userId,
          email: newUser.email,
          role: newUser.role,
          tenantId: null,
          enabled: newUser.enabled,
          userName: newUser.userName,
          creationDate: newUser.creationDate
        }
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: String(err.message || err) });
    }
  }
);




router.post(
  "/tenant",
  requireAuth,
  allowRoles("superAdmin"),
  async (req, res) => {
    try {
      const {
        accountName,
        email,
        password,
        regAddress = "",
        officialEmail = email,
        officialContactNumber = "",
        contacts = []
      } = req.body || {};

      if (!accountName || !email || !password) {
        return res.status(400).json({ error: "accountName, email, password are required" });
      }

      const tenantId = String(accountName).trim().toLowerCase();

      const existingTenant = await TenantRepo().findOne({ where: { id: tenantId } });
      if (existingTenant) return res.status(400).json({ error: "Tenant already exists" });

      const tenant = TenantRepo().create({
        id: tenantId,
        accountName,
        regAddress,
        officialEmail,
        officialContactNumber,
        email,     // prototype
        password,  // prototype
        creationDate: new Date()
      });
      await TenantRepo().save(tenant);

      const roleTenant = await getRoleOrThrow("tenant");

      const tenantUser = UserRepo().create({
        userId: `u-${tenantId}-tenant-${Date.now()}`,
        password,
        userName: `${accountName} TenantUser`,
        contactDetails: "",
        contactEmail: email,
        creationDate: new Date(),
        createdBy: req.user.userId,
        enabled: true,
        email,
        role: "tenant",
        roleRef: roleTenant,
        tenant      // ← superadmin flow me tenant user bound hoga
      });
      await UserRepo().save(tenantUser);

      return res.json({
        msg: "Tenant created with tenant user (bound)",
        tenant: {
          id: tenant.id,
          accountName: tenant.accountName,
          creationDate: tenant.creationDate,
          regAddress: tenant.regAddress,
          officialEmail: tenant.officialEmail,
          officialContactNumber: tenant.officialContactNumber
        },
        tenantUser: {
          userId: tenantUser.userId,
          email: tenantUser.email,
          role: tenantUser.role,
          tenantId: tenant.id,
          enabled: tenantUser.enabled,
          creationDate: tenantUser.creationDate
        }
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: String(err.message || err) });
    }
  }
);

/** ======================
 * 2) TENANT → Create Admin (within tenant)
 *    (अगर tenant का खुद का tenant NULL है, to body.tenantId चाहिए)
 * ====================== */
router.post(
  "/admin",
  requireAuth,
  allowRoles("tenant"),
  async (req, res) => {
    try {
      const { email, password, userName, tenantId } = req.body || {};
      if (!email || !password || !userName) {
        return res.status(400).json({ error: "email, password, userName are required" });
      }

      // resolve target tenant: prefer body.tenantId, else caller's token
      const effectiveTenantId = tenantId ?? req.user.tenantId ?? null;
      if (!effectiveTenantId) {
        return res.status(400).json({ error: "tenantId is required (caller has no tenant bound)" });
      }

      const tenant = await TenantRepo().findOne({ where: { id: effectiveTenantId } });
      if (!tenant) return res.status(404).json({ error: "Tenant not found" });

      const dup = await findUserByEmailAndTenant(email, effectiveTenantId);
      if (dup) return res.status(400).json({ error: "Email already used in this tenant" });

      const roleAdmin = await getRoleOrThrow("admin");

      const adminUser = UserRepo().create({
        userId: `u-${effectiveTenantId}-admin-${Date.now()}`,
        password,
        userName,
        contactDetails: "",
        contactEmail: email,
        creationDate: new Date(),
        createdBy: req.user.userId,
        enabled: true,
        email,
        role: "Admin",
        roleRef: roleAdmin,
        tenant      // must be bound for admin
      });

      await UserRepo().save(adminUser);

      return res.json({
        msg: "Admin user created",
        user: {
          userId: adminUser.userId,
          email: adminUser.email,
          role: adminUser.role,
          tenantId: tenant.id,
          enabled: adminUser.enabled,
          userName: adminUser.userName,
          creationDate: adminUser.creationDate
        }
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: String(err.message || err) });
    }
  }
);

/** ======================
 * 3) MULTI-ROLE USER CREATE (updated)
 *    superAdmin | tenant | Admin - sab yahi use karein
 *    Rules:
 *      - superAdmin can create:
 *          - superadmin/tenant with optional tenantId (NULL if missing)
 *          - admin/agent/auditor/reviewer → tenant required (body.tenantId)
 *      - tenant can create:
 *          - admin → tenant required (body.tenantId or caller.tenantId)
 *          - agent/auditor/reviewer → optionally allow? (default: NO; keep admin-only)
 *      - Admin can create:
 *          - agent/auditor/reviewer within own tenant (tenant resolved)
 * ====================== */
router.post(
  "/user",
  requireAuth,
  allowRoles("superAdmin", "tenant", "Admin"),
  async (req, res) => {
    try {
      const { email, password, userName, role, tenantId } = req.body || {};
      if (!email || !password || !userName || !role) {
        return res.status(400).json({ error: "email, password, userName, role are required" });
      }

      const callerRole = (req.user.role || "").toLowerCase();
      const newRole = String(role).toLowerCase();

      // Validate who can create what
      const isSuper = callerRole === "superadmin";
      const isTenant = callerRole === "tenant";
      const isAdmin = callerRole === "admin";

      const allowedForAdmin = ["agent", "auditor", "reviewer"];
      const allowedForTenant = ["admin"]; // keep strict; can expand if needed
      const allowedForSuper = ["superadmin", "tenant", "admin", "agent", "auditor", "reviewer"];

      if (isAdmin && !allowedForAdmin.includes(newRole)) {
        return res.status(403).json({ error: "Admin can only create agent/auditor/reviewer" });
      }
      if (isTenant && !allowedForTenant.includes(newRole)) {
        return res.status(403).json({ error: "Tenant user can only create admin" });
      }
      if (isSuper && !allowedForSuper.includes(newRole)) {
        return res.status(403).json({ error: "Not allowed role" });
      }

      // Determine effective tenant binding for new user:
      let effectiveTenant = null;      // object
      let effectiveTenantId = tenantId ?? null;

      // Cases:
      // - New role = superadmin | tenant: tenant optional
      // - New role = admin/agent/auditor/reviewer: tenant required
      const roleNeedsTenant = !["superadmin", "tenant"].includes(newRole);

      if (roleNeedsTenant) {
        // If caller is Admin: force to caller's tenant
        if (isAdmin) {
          effectiveTenantId = req.user.tenantId ?? null;
        }
        // If caller is tenant and has tenant bound, prefer caller's tenant when not provided
        if (isTenant && !effectiveTenantId) {
          effectiveTenantId = req.user.tenantId ?? null;
        }
        if (!effectiveTenantId) {
          return res.status(400).json({ error: "tenantId is required for this role" });
        }
        effectiveTenant = await TenantRepo().findOne({ where: { id: effectiveTenantId } });
        if (!effectiveTenant) return res.status(404).json({ error: "Tenant not found" });
      } else {
        // optional tenant for superadmin/tenant
        if (effectiveTenantId) {
          effectiveTenant = await TenantRepo().findOne({ where: { id: effectiveTenantId } });
          if (!effectiveTenant) return res.status(404).json({ error: "Tenant not found" });
        } else {
          effectiveTenant = null; // keep null
        }
      }

      // Uniqueness check (per-tenant or global-null)
      const dup = await findUserByEmailAndTenant(email, effectiveTenant ? effectiveTenant.id : null);
      if (dup) {
        return res.status(400).json({ error: "Email already used for this tenant scope" });
      }

      const roleRef = await getRoleOrThrow(newRole);
      const newUser = UserRepo().create({
        userId: `u-${effectiveTenant ? effectiveTenant.id : "global"}-${newRole}-${Date.now()}`,
        password,
        userName,
        contactDetails: "",
        contactEmail: email,
        creationDate: new Date(),
        createdBy: req.user.userId,
        enabled: true,
        email,
        role: newRole.charAt(0).toUpperCase() + newRole.slice(1),
        roleRef,
        tenant: effectiveTenant // may be null for superadmin/tenant
      });

      await UserRepo().save(newUser);

      return res.status(201).json({
        msg: "User created",
        user: {
          userId: newUser.userId,
          email: newUser.email,
          role: newUser.role,
          tenantId: effectiveTenant ? effectiveTenant.id : null,
          enabled: newUser.enabled,
          userName: newUser.userName,
          creationDate: newUser.creationDate
        }
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: String(err.message || err) });
    }
  }
);

export default router;
