// migrations/1710000000000-SeedRoles.js
module.exports = class SeedRoles1710000000000 {
  name = 'SeedRoles1710000000000';

  async up(queryRunner) {
    await queryRunner.query(`
      INSERT INTO "role" ("id","name","createdby")
      VALUES
        ('superadmin','Super Admin',NULL),
        ('tenant','Tenant',NULL),
        ('admin','Admin',NULL),
        ('user','User',NULL),
        ('agent','Agent',NULL),
        ('auditor','Auditor',NULL),
        ('reviewer','Reviewer',NULL),
      ON CONFLICT ("id") DO NOTHING
    `);
  }

  async down(queryRunner) {
    await queryRunner.query(`
      DELETE FROM "role" WHERE "id" IN ('superadmin','tenant','admin','user', agent, auditor,reviewer )
    `);
  }
};
