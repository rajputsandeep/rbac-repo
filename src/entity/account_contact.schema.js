import { EntitySchema } from "typeorm";

export const AccountContactSchema = new EntitySchema({
  name: "AccountContact",
  tableName: "account_contact",
  columns: {
    id: { type: "uuid", primary: true, generated: "uuid" },
    contactType: { type: "text", nullable: true },
    contactDetails: { type: "text", nullable: true },
    contactName: { type: "text", nullable: true },
    contactDesignation: { type: "text", nullable: true }
  },
  relations: {
    tenant: {
      type: "many-to-one",
      target: "TenantAccount",
      joinColumn: { name: "tenant_id" },
      onDelete: "CASCADE"
    }
  }
});
