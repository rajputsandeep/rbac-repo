// routes/me.js
import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { AppDataSource } from "../dataSource/data-source.js";

const router = express.Router();

const UserRepo        = () => AppDataSource.getRepository("AppUser");
const TenantRepo      = () => AppDataSource.getRepository("TenantAccount");
const RoleRepo        = () => AppDataSource.getRepository("Role");
const PermissionRepo  = () => AppDataSource.getRepository("Permission");

router.get("/me", requireAuth, async (req, res) => {
  try {
    const { userId, role, tenantId, email } = req.user || {};
    const roleNorm = (role || "").toLowerCase();

    // ------------------ 1) SUPER ADMIN ------------------
    if (roleNorm === "superadmin") {
      // Try to find superadmin row in app_user
      let superAdmin = await UserRepo().createQueryBuilder("u")
        .leftJoinAndSelect("u.tenant", "t")
        .leftJoinAndSelect("u.roleRef", "r")
        .where("LOWER(u.email) = LOWER(:email)", { email })
        .getOne();

      // If not present in app_user, try tenant_account 'superCompany' (minimal fallback)
      const tenants = await TenantRepo().find();

      if (!superAdmin) {
        // try to read superCompany tenant row (optional)
        const sc = await TenantRepo().findOne({ where: { id: "superCompany" } });
        return res.json({
          role: "superAdmin",
          superAdmin: sc
            ? {
                id: "superadmin",
                accountName: sc.accountName,
                email: sc.email,
                creationDate: sc.creationDate,
                regAddress: sc.regAddress,
                officialEmail: sc.officialEmail,
                officialContactNumber: sc.officialContactNumber,
                contacts: [], // tenant_account contacts अलग table में हों तो यहां जोड़ें
              }
            : {
                id: "superadmin",
                accountName: "System SuperAdmin",
                email,
                creationDate: null,
                regAddress: null,
                officialEmail: null,
                officialContactNumber: null,
                contacts: [],
              },
          tenants: tenants.map((t) => ({
            id: t.id,
            accountName: t.accountName,
            creationDate: t.creationDate,
            regAddress: t.regAddress,
            officialEmail: t.officialEmail,
            officialContactNumber: t.officialContactNumber,
          })),
        });
      }

      // superadmin was found in app_user
      return res.json({
        role: "superAdmin",
        superAdmin: {
          userId: superAdmin.userId,
          email: superAdmin.email,
          userName: superAdmin.userName,
          tenantId: superAdmin.tenant ? superAdmin.tenant.id : null,
          enabled: superAdmin.enabled,
          creationDate: superAdmin.creationDate,
        },
        tenants: tenants.map((t) => ({
          id: t.id,
          accountName: t.accountName,
          creationDate: t.creationDate,
          regAddress: t.regAddress,
          officialEmail: t.officialEmail,
          officialContactNumber: t.officialContactNumber,
        })),
      });
    }

    // ------------------ 2) TENANT LOGIN (tenant_account based) ------------------
    // Login type 'tenant' आपने JWT में set किया है; कुछ जगह आपने 'tenant' लिखा था,
    // पर login service DB-only में हमने tenant_account वाले case को type = 'tenant' रखा है.
    if (roleNorm === "tenant") {
      // Resolve tenant by token.tenantId or by email
      let tenant = null;
      if (tenantId) {
        tenant = await TenantRepo().findOne({ where: { id: tenantId } });
      } else if (email) {
        tenant = await TenantRepo()
          .createQueryBuilder("t")
          .where("LOWER(t.email) = LOWER(:email)", { email })
          .getOne();
      }

      if (!tenant) {
        return res.status(404).json({ error: "Tenant not found" });
      }

      // All app_user rows under this tenant
      const users = await UserRepo().createQueryBuilder("u")
        .leftJoinAndSelect("u.roleRef", "r")
        .leftJoinAndSelect("u.tenant", "t")
        .where("t.id = :tid", { tid: tenant.id })
        .getMany();

      return res.json({
        role: "tenant",
        tenant: {
          id: tenant.id,
          accountName: tenant.accountName,
          creationDate: tenant.creationDate,
          regAddress: tenant.regAddress,
          officialEmail: tenant.officialEmail,
          officialContactNumber: tenant.officialContactNumber,
        },
        users: users.map(u => ({
          userId: u.userId,
          email: u.email,
          role: u.roleRef?.id || u.role,
          userName: u.userName,
          enabled: u.enabled,
          creationDate: u.creationDate,
        })),
      });
    }

    // ------------------ 3) END USER (Admin/Agent/Auditor/Reviewer/tenant in app_user) ------------------
    let user = await UserRepo().findOne({
      where: [
        { userId: userId || "" },
        { email: email || "" },
      ],
      relations: ["tenant", "roleRef"],
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // role/permissions
    const roleId = user.roleRef?.id || (user.role || "").toLowerCase();
    const roleRow = await RoleRepo().findOne({ where: { id: roleId } });
    const permissions = await PermissionRepo().find({
      where: { role: { id: roleId } },
      relations: ["role"],
    });

    const base = {
      userId: user.userId,
      email: user.email,
      role: user.roleRef?.name || user.role,
      roleId: roleId,
      tenant: user.tenant
        ? {
            id: user.tenant.id,
            accountName: user.tenant.accountName,
            creationDate: user.tenant.creationDate,
            regAddress: user.tenant.regAddress,
            officialEmail: user.tenant.officialEmail,
            officialContactNumber: user.tenant.officialContactNumber,
          }
        : null,
      enabled: user.enabled,
      userName: user.userName,
      creationDate: user.creationDate,
      permissions: permissions.map((p) => ({
        access: p.access,
        enabled: p.enabled,
      })),
    };

    // If Admin → include other users in same tenant (excluding self)
    const isAdmin =
      roleId === "admin" || (user.role || "").toLowerCase() === "admin";
    if (isAdmin && user.tenant) {
      const tenantUsers = await UserRepo().createQueryBuilder("u")
        .leftJoinAndSelect("u.tenant", "t")
        .where("t.id = :tid", { tid: user.tenant.id })
        .andWhere(`u."userId" <> :uid`, { uid: user.userId })
        .getMany();

      base.tenantUsers = tenantUsers.map((u) => ({
        userId: u.userId,
        email: u.email,
        role: u.roleRef?.id || u.role,
        userName: u.userName,
        enabled: u.enabled,
        creationDate: u.creationDate,
      }));
    }

    return res.json(base);
  } catch (err) {
    console.error("GET /me error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
