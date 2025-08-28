import { EntitySchema } from "typeorm";

export const RoleSchema = new EntitySchema({
  name: "Role",
  tableName: "role",
  columns: {
    id: { type: "text", primary: true }, // 'superadmin'|'tenent'|'admin'|...
    name: { type: "text" },
    creationdate: { type: "timestamptz", default: () => "now()" },
    createdby: { type: "text", nullable: true }
  }
});
