import { Entity, PrimaryColumn, Column, OneToMany } from "typeorm";
import "reflect-metadata";
import { AppUser } from "./app_user.js";
import { Permission } from "./permission.js";

@Entity({ name: "role" })
export class Role {
  // text PK to match seed: 'superadmin','tenant','admin','agent','auditor','reviewer'
  @PrimaryColumn({ type: "text" })
  id;

  @Column({ type: "text" })
  name;

  @Column({ type: "timestamptz", default: () => "now()" })
  creationDate;

  @Column({ type: "text", nullable: true })
  createdBy;

  @OneToMany(() => AppUser, (u) => u.roleRef)
  users;

  @OneToMany(() => Permission, (p) => p.role)
  permissions;
}
