import { EntitySchema } from "typeorm";

export const AppUserSchema = new EntitySchema({
  name: "AppUser",
  tableName: "app_user",
  columns: {
    userId: { type: "text", primary: true },
    password: { type: "text" }, // prototype
    userName: { type: "text", nullable: true },
    contactDetails: { type: "text", nullable: true },
    contactEmail: { type: "text", nullable: true },
    creationdate: { type: "timestamptz", default: () => "now()" },
    createdby: { type: "text", nullable: true },
    enabled: { type: "boolean", default: true },
    email: { type: "text" },
    role: { type: "text" } // denormalized
  },
  relations: {
    roleRef: {
      type: "many-to-one",
      target: "Role",
      joinColumn: { name: "role_id" },
      eager: true
    },
    tenant: {
      type: "many-to-one",
      target: "TenantAccount",
      joinColumn: { name: "tenant_id" },
      nullable: true,   // 👈 allow null tenant_id
      eager: true,
      onDelete: "CASCADE"
    }
  }
});
