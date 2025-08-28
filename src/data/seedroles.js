// seeds/seedRoles.js
/**
 * Seeds the "role" table with default roles.
 * Safe to run repeatedly: uses upsert on the primary key (id).
 */
export async function seedRolesOnce(dataSource) {
  const repo = dataSource.getRepository('Role');

  // Define your default roles (id is the primary key, text)
  const DEFAULT_ROLES = [
    { id: 'superadmin', name: 'Super Admin' },
    { id: 'tenant',     name: 'Tenant'     },
    { id: 'admin',      name: 'Admin'      },
    { id: 'user',       name: 'User'       },
    { id: 'agent',      name: 'Agent' },
    { id: 'auditor',     name: 'Auditor'     },
    { id: 'reviewer',      name: 'Reviewer'  },
  ];

  // If you want to record who seeded them:
  const createdBy = process.env.SEED_CREATED_BY || null;
  const rows = DEFAULT_ROLES.map(r => ({
    ...r,
    // omit creationdate to use DB default now()
    createdby: createdBy,
  }));

  // Option A: fast path — if table is empty, insert all
  const count = await repo.count();
  if (count === 0) {
    await repo
      .createQueryBuilder()
      .insert()
      .into('role') // tableName from your schema
      .values(rows)
      .orIgnore() // ON CONFLICT DO NOTHING
      .execute();
    return;
  }

  // Option B: idempotent upsert in case table is partially seeded
  // (TypeORM v0.3+)
  await repo.upsert(rows, ['id']); // primary key column
}
export default seedRolesOnce
