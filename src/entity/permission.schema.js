import { EntitySchema } from "typeorm";

export const PermissionSchema = new EntitySchema({
  name: "Permission",
  tableName: "permission",
  columns: {
    id: { type: "uuid", primary: true, generated: "uuid" },
    access: { type: "text" },
    enabled: { type: "boolean", default: false }
  },
  uniques: [
    { columns: ["role", "access"] } // same as @Unique(['role','access'])
  ],
  relations: {
    role: {
      type: "many-to-one",
      target: "Role",
      joinColumn: { name: "role_id" },
      onDelete: "CASCADE"
    }
  }
});
