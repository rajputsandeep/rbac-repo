# EPIC E1 — Secure Authentication & Tenant Propagation

Node.js + Express reference implementation with JWT login, gateway validation, `/me`, and role guard scaffolding.

## Features

- **E1.1 Auth Service**: `POST /auth/login` issues JWT with `role` and `tenantId` claims.
- **E1.2 Gateway Middleware**: Validates JWT on protected routes and enforces `X-Tenant-Id` header (configurable).
- **E1.3 `/me` endpoint**: Returns `{ userId, email, role, tenantId }`.
- **E1.4 Role Guard**: `allowRoles('Admin' | 'Agent' | 'Auditor' | 'Reviewer')`.

> Storage is **static in-memory** for now. Swap `src/data/seed.js` with Postgres later.

## Quickstart

```bash
# 1) Extract and install
npm install

# 2) Configure environment
cp .env.example .env
# Edit .env and set JWT_SECRET (keep it long & random)

# 3) Run
npm run dev
# API on http://localhost:4000
```

## Endpoints

### `POST /auth/login`

Body:
```json
{ "email": "admin@1mg.example.com", "password": "Password@123" }
```

Response:
```json
{
  "access_token": "<JWT>",
  "token_type": "Bearer",
  "expires_in": "configured",
  "role": "Admin",
  "tenantId": "acct-1mg"
}
```

### `GET /me`

Headers:
```
Authorization: Bearer <JWT>
X-Tenant-Id: <tenantId from token>  # required if ENFORCE_TENANT_HEADER=true
```

Response:
```json
{ "userId": "u-admin-1", "email": "admin@1mg.example.com", "role": "Admin", "tenantId": "acct-1mg" }
```

### Example protected route

```
GET /admin/ping
Authorization: Bearer <JWT>
X-Tenant-Id: acct-1mg
```
Only `Admin` role can access.

## Seed data

- Tenants: `acct-1mg`, `acct-apollo`
- Users:
  - **Admin** (1MG): `admin@1mg.example.com` / `Password@123`
  - **Agent** (1MG): `agent@1mg.example.com` / `Agent@123`
  - **Auditor** (Apollo): `auditor@apollo.example.com` / `Auditor@123`

> Passwords are plain-text for the prototype **only**. When you move to Postgres, store a `passwordHash` and verify using `bcrypt`.

## Notes for Postgres migration

- Replace `src/data/seed.js` with tables:
  - `tenant_account(id PK, account_name, creation_date, reg_address, official_email, official_contact_number)`
  - `account_contact(aid FK -> tenant_account.id, contact_type, contact_details, contact_name, contact_designation)`
  - `role(id PK, name, creation_date, created_by)`
  - `permission(role_id FK, access, enabled)`
  - `users(user_id PK, password_hash, user_name, contact_details, contact_email, creation_date, created_by, enabled, role_id FK, tenant_id FK)`
- Update `/auth/login` to fetch user by email and compare with `bcrypt.compare()`.
- Keep JWT claims the same to avoid breaking the gateway.

## Security hardening checklist

- Use strong `JWT_SECRET` with at least 32 random bytes.
- Set `JWT_EXPIRES_IN` to a reasonable value (e.g., `15m`).
- Enable HTTPS in your deployment.
- Rate limit login (already added).
- Add account lockout / MFA if needed.
- Validate inputs (e.g., with Zod/Joi) when you wire up real DB.
