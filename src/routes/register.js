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



router.post(
  "/user",
  requireAuth,
  allowRoles("tenant", "Admin"),
  async (req, res) => {
    try {
      const { email, password, userName, role } = req.body || {};
      if (!email || !password || !userName || !role) {
        return res.status(400).json({ error: "email, password, userName, roles are required" });
      }

      const callerRole = (req.user.role || "").toLowerCase();
      const newRole = String(role).toLowerCase();

      const isTenant = callerRole === "tanent" || callerRole === "tenant";
      const isAdmin  = callerRole === "admin";

      // ✅ Allowed create sets
      const allowedForTenant = ["admin", "agent", "auditor", "reviewer"];
      const allowedForAdmin  = ["agent", "auditor", "reviewer"];

      if (isTenant && !allowedForTenant.includes(newRole)) {
        return res.status(403).json({ error: "Tenant can create only admin/agent/auditor/reviewer" });
      }
      if (isAdmin && !allowedForAdmin.includes(newRole)) {
        return res.status(403).json({ error: "Admin can create only agent/auditor/reviewer" });
      }

      // ❌ Block creating superadmin/tenant users from this endpoint
      if (["superadmin", "tenant", "tanent"].includes(newRole)) {
        return res.status(403).json({ error: "Cannot create superadmin/tenant users here" });
      }

      // 🔐 Always bind to caller's tenant
      const effectiveTenantId = req.user.tenantId || null;
      if (!effectiveTenantId) {
        return res.status(400).json({ error: "Caller must be bound to a tenant" });
      }

      const effectiveTenant = await TenantRepo().findOne({ where: { id: effectiveTenantId } });
      if (!effectiveTenant) return res.status(404).json({ error: "Tenant not found" });

      // Uniqueness within the tenant
      const dup = await findUserByEmailAndTenant(email, effectiveTenant.id);
      if (dup) {
        return res.status(400).json({ error: "Email already used in this tenant" });
      }

      const roleRef = await getRoleOrThrow(newRole);

      const newUser = UserRepo().create({
        userId: `u-${effectiveTenant.id}-${newRole}-${Date.now()}`,
        password,
        userName,
        contactDetails: "",
        contactEmail: email,
        creationDate: new Date(),
        createdBy: req.user.userId,
        enabled: true,
        email,
        role: newRole.charAt(0).toUpperCase() + newRole.slice(1), // "Admin"/"Agent"/...
        roleRef,
        tenant: effectiveTenant
      });

      await UserRepo().save(newUser);

      return res.status(201).json({
        msg: "User created",
        user: {
          userId: newUser.userId,
          email: newUser.email,
          role: newUser.role,
          tenantId: effectiveTenant.id,
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
