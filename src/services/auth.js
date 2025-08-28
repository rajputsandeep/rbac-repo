// // services/auth.js
// import { superCompany, Tenants, Users } from '../data/seed.js';


// // { id, email, type, tenantId?, userName? }
// export function findAuthSubject(email, password) {
//   if (!email || !password) return null;

//   // 1) Super Admin check (Synthora array से)
//   const superAdmin = superCompany.find(
//     (s) => s.email === email && s.password === password
//   );
//   if (superAdmin) {
//     return {
//       id: superAdmin.id,
//       email: superAdmin.email,
//       type: 'superAdmin',
//     };
//   }

//   // 2) Tenant check (Tenants array)
//   const tenant = Tenants.find(
//     (t) => t.email === email && t.password === password
//   );
//   if (tenant) {
//     return {
//       id: tenant.id,
//       email: tenant.email,
//       type: 'tenant',
//     };
//   }

//   // 3) End User check (Users array)
//   const user = Users.find(
//     (u) => u.email === email && u.password === password
//   );
//   if (user) {
//     return {
//       id: user.userId,
//       email: user.email,
//       type: user.role || user.roleId, // Admin / agent / auditor / reviewer
//       tenantId: user.tenantId,
//       userName: user.userName,
//     };
//   }


//   return null;
// }





import { AppDataSource } from "../dataSource/data-source.js";

function norm(s) {
  return (s || "").toString().trim();
}
function eqi(a, b) {
  return norm(a).toLowerCase() === norm(b).toLowerCase();
}

/**
 * DB-first auth:
 *  - app_user → matches all normal users (superadmin/tenant/admin/agent/etc.)
 *  - tenant_account → fallback for tenant login (tenant account)
 * 
 * Returns { id, email, type, tenantId?, userName? }
 */
export async function findAuthSubject(email, password) {
  if (!email || !password) return null;
  const e = norm(email);
  const p = norm(password);

  if (!AppDataSource?.isInitialized) {
    throw new Error("DB not initialized");
  }

  const userRepo = AppDataSource.getRepository("AppUser");
  const tenantRepo = AppDataSource.getRepository("TenantAccount");

  // --- 1) Try AppUser (covers superadmin/tenant/admin/agent/auditor/reviewer) ---
  let dbUser = await userRepo
    .createQueryBuilder("u")
    .leftJoinAndSelect("u.roleRef", "r")
    .leftJoinAndSelect("u.tenant", "t")
    .where("LOWER(u.email) = LOWER(:email)", { email: e })
    .getOne();

  if (dbUser && dbUser.enabled && norm(dbUser.password) === p) {
    const roleId = dbUser.roleRef?.id || (dbUser.role || "").toLowerCase();
    const type =
      roleId === "superadmin"
        ? "superAdmin"
        : roleId === "tenant"
        ? "tenant"
        : dbUser.role || "User"; // e.g. "Admin", "Agent"

    return {
      id: dbUser.userId,
      email: dbUser.email,
      type,
      tenantId: dbUser.tenant ? dbUser.tenant.id : null, // null for superadmin/tenant
      userName: dbUser.userName || null,
    };
  }

  // --- 2) Tenant login (tenant_account row acts as "tenant user") ---
  const dbTenant = await tenantRepo
    .createQueryBuilder("t")
    .where("LOWER(t.email) = LOWER(:email)", { email: e })
    .getOne();

  if (dbTenant && norm(dbTenant.password) === p) {
    return {
      id: dbTenant.id,
      email: dbTenant.email,
      type: "tenant",
      tenantId: dbTenant.id,
      userName: dbTenant.accountName,
    };
  }

  return null;
}
