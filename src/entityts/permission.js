import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from "typeorm";
import "reflect-metadata"; // decorators सपोर्ट के लिए
import { Role } from "./role.js";

@Entity({ name: "permission" })
@Unique(["role", "access"])
export class Permission {
  @PrimaryGeneratedColumn("uuid")
  id;

  @ManyToOne(() => Role, (r) => r.permissions, { onDelete: "CASCADE" })
  @JoinColumn({ name: "role_id" })
  role;

  @Column({ type: "text" })
  access;

  @Column({ type: "boolean", default: false })
  enabled;
}
