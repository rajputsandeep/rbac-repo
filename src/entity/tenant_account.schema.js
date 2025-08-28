import { EntitySchema } from "typeorm";

export const TenantAccountSchema = new EntitySchema({
  name: "TenantAccount",
  tableName: "tenant_account",
  columns: {
    id: { type: "text", primary: true },
    accountName: { type: "text" },
    creationDate: { type: "timestamptz", default: () => "now()" },
    regAddress: { type: "text", nullable: true },
    officialEmail: { type: "text", nullable: true },
    officialContactNumber: { type: "text", nullable: true },
    email: { type: "text", nullable: true },    // prototype
    password: { type: "text", nullable: true }, // prototype
  }
});
