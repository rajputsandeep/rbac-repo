import "reflect-metadata";
import { DataSource } from "typeorm";
import { config } from "../config.js";
import dotenv from 'dotenv';
// EntitySchemas
import { TenantAccountSchema } from "../entity/tenant_account.schema.js";
import { AccountContactSchema } from "../entity/account_contact.schema.js";
import { RoleSchema } from "../entity/role.schema.js";
import { PermissionSchema } from "../entity/permission.schema.js";
import { AppUserSchema } from "../entity/app_user.schema.js";

// export const AppDataSource = new DataSource({
//   type: "postgres",
//   // host: config.db.host || "localhost",
//   // port: config.db.port || 5432,
//   // username: config.db.username || "postgres",
//   // password: config.db.password || "22041992",
//   // database: config.db.database || "postgres",


//   synchronize: true,  // dev only
//   logging: true,
//   entities: [
//     TenantAccountSchema,
//     AccountContactSchema,
//     RoleSchema,
//     PermissionSchema,
//     AppUserSchema
//   ],
// });
const isProd = process.env.NODE_ENV === 'production';
const wantSSL = (process.env.DB_SSL || '').toLowerCase() === 'true' || isProd;
console.log("dotenv file", config.url)
export const AppDataSource = new DataSource({
  type: 'postgres',
  url:config.url,
    entities: [
    TenantAccountSchema,
    AccountContactSchema,
    RoleSchema,
    PermissionSchema,
    AppUserSchema
  ],
  migrations: ['migrations/*.js'],
  synchronize: true,
  logging: true,
  ssl: wantSSL ? { rejectUnauthorized: true } : true,
  extra: {
    max: Number(process.env.DB_MAX || 10),
    connectionTimeoutMillis: Number(process.env.DB_CONN_TIMEOUT || 5000),
    idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT || 10000),
    ...(wantSSL ? { ssl: { rejectUnauthorized: true } } : {}),
  },
});