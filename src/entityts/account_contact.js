// import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
// import { TenantAccount } from './tenant_account';

// @Entity({ name: 'account_contact' })
// export class AccountContact {
//   @PrimaryGeneratedColumn('uuid')
//   id!: string;

//   @Column({ type: 'text', nullable: true })
//   contactType!: string | null;

//   @Column({ type: 'text', nullable: true })
//   contactDetails!: string | null;

//   @Column({ type: 'text', nullable: true })
//   contactName!: string | null;

//   @Column({ type: 'text', nullable: true })
//   contactDesignation!: string | null;

//   @ManyToOne(() => TenantAccount, t => t.contacts, { onDelete: 'CASCADE' })
//   @JoinColumn({ name: 'tenant_id' })
//   tenant!: TenantAccount;
// }
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import "reflect-metadata"; // decorators के लिए ज़रूरी
import { TenantAccount } from "./tenant_account.js";

@Entity({ name: "account_contact" })
export class AccountContact {
  @PrimaryGeneratedColumn("uuid")
  id;

  @Column({ type: "text", nullable: true })
  contactType;

  @Column({ type: "text", nullable: true })
  contactDetails;

  @Column({ type: "text", nullable: true })
  contactName;

  @Column({ type: "text", nullable: true })
  contactDesignation;

  @ManyToOne(() => TenantAccount, (t) => t.contacts, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tenant_id" })
  tenant;
}
