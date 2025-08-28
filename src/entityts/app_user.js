import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import "reflect-metadata"; 
import { TenantAccount } from "./tenant_account.js";
import { Role } from "./role.js";

@Entity({ name: "app_user" })
export class AppUser {
  // text PK to match your current IDs like 'u-admin-1'
  @PrimaryColumn({ type: "text" })
  userId;

  @Column({ type: "text" })
  password; // plain for prototype only; use hash later

  @Column({ type: "text", nullable: true })
  userName;

  @Column({ type: "text", nullable: true })
  contactDetails;

  @Column({ type: "text", nullable: true })
  contactEmail;

  @Column({ type: "timestamptz", default: () => "now()" })
  creationDate;

  @Column({ type: "text", nullable: true })
  createdBy;

  @Column({ type: "boolean", default: true })
  enabled;

  @Column({ type: "text" })
  email;

  // denormalized role name for convenience (optional)
  @Column({ type: "text" })
  role;

  // Relations
  @ManyToOne(() => Role, (r) => r.users, { eager: true })
  @JoinColumn({ name: "role_id" })
  roleRef;

  @ManyToOne(() => TenantAccount, (t) => t.users, { eager: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id" })
  tenant;
}
