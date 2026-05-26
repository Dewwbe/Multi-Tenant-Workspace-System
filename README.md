# Multi-Tenant Workspace System

> A production-grade NestJS SaaS backend with workspace isolation, JWT authentication, and role-based access control.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Main Features](#main-features)
- [Technologies Used](#technologies-used)
- [Project Structure](#project-structure)
- [Database Structure](#database-structure)
- [Role-Based Access Control](#role-based-access-control)
- [Tenant Isolation](#tenant-isolation)
- [Authentication Flow](#authentication-flow)
- [Environment Variables](#environment-variables)
- [Docker Setup](#docker-setup)
- [Project Setup Instructions](#project-setup-instructions)
- [Useful Commands](#useful-commands)
- [API Response Format](#api-response-format)
- [Automated Testing](#automated-testing)
- [Logging](#logging)
- [Postman Testing Guide](#postman-testing-guide)
- [Common Errors](#common-errors)
- [Git Workflow](#git-workflow)
- [Future Improvements](#future-improvements)

---

## Project Overview

The **Multi-Tenant Workspace System** is a NestJS backend project built using **TypeScript**, **Prisma**, and **PostgreSQL**.

This project simulates a real-world SaaS backend where users can create and manage workspaces. Each workspace acts as a separate tenant, and users can only access data that belongs to workspaces where they are members.

The project focuses on:

- Multi-tenant backend architecture
- JWT authentication
- Role-based access control
- Workspace-level data isolation
- Clean NestJS module structure
- Reusable authorization logic
- Prisma-based relational database design
- Automated testing and request logging

---

## Main Features

- User registration and login
- JWT-based authentication
- Password hashing using bcrypt
- Workspace creation
- Automatic owner membership creation
- Workspace member management
- Role-based access control
- Notes management inside workspaces
- Tenant isolation using `workspaceId`
- Prisma database relationships
- DTO validation using `class-validator`
- Thin controllers and service-based business logic
- Reusable guards and decorators
- Request logging middleware
- End-to-end testing using Jest and Supertest

---

## Technologies Used

### Backend

- Node.js
- NestJS
- TypeScript

### Database

- PostgreSQL
- Prisma ORM

### Authentication

- JWT
- Passport JWT
- bcrypt

### Validation

- class-validator
- class-transformer

### Testing

- Jest
- Supertest

### Development Tools

- Docker
- Prisma CLI
- Postman
- Swagger
- VS Code

---

## Project Structure

```text
src/
│
├── auth/
│   ├── dto/
│   │   ├── login.dto.ts
│   │   └── register.dto.ts
│   ├── auth.controller.ts
│   ├── auth.module.ts
│   ├── auth.service.ts
│   ├── jwt-auth.guard.ts
│   └── jwt.strategy.ts
│
├── users/
│   ├── users.module.ts
│   └── users.service.ts
│
├── workspaces/
│   ├── dto/
│   │   ├── create-workspace.dto.ts
│   │   └── update-workspace.dto.ts
│   ├── workspaces.controller.ts
│   ├── workspaces.module.ts
│   └── workspaces.service.ts
│
├── members/
│   ├── dto/
│   │   ├── add-member.dto.ts
│   │   └── update-member-role.dto.ts
│   ├── members.controller.ts
│   ├── members.module.ts
│   └── members.service.ts
│
├── notes/
│   ├── dto/
│   │   ├── create-note.dto.ts
│   │   └── update-note.dto.ts
│   ├── notes.controller.ts
│   ├── notes.module.ts
│   └── notes.service.ts
│
├── common/
│   ├── decorators/
│   │   ├── current-user.decorator.ts
│   │   └── workspace-roles.decorator.ts
│   ├── dto/
│   │   └── api-response.dto.ts
│   ├── guards/
│   │   ├── workspace-member.guard.ts
│   │   └── workspace-roles.guard.ts
│   ├── interfaces/
│   │   ├── auth-user.interface.ts
│   │   ├── authenticated-request.interface.ts
│   │   └── jwt-payload.interface.ts
│   └── middleware/
│       └── request-logger.middleware.ts
│
├── prisma/
│   ├── prisma.module.ts
│   └── prisma.service.ts
│
├── app.module.ts
└── main.ts
```

---

## Database Structure

The system contains four main entities:

### User

Stores registered user details.

| Field | Type |
|---|---|
| id | String UUID |
| name | String |
| email | String unique |
| password | String hashed |
| createdAt | DateTime |
| updatedAt | DateTime |

**Rules:**

- Email must be unique.
- Password is hashed before saving.
- Password is never returned in API responses.

### Workspace

Represents a tenant or workspace.

| Field | Type |
|---|---|
| id | String UUID |
| name | String |
| slug | String unique |
| ownerId | String |
| createdAt | DateTime |
| updatedAt | DateTime |

**Rules:**

- Slug must be unique.
- Workspace creator automatically becomes the owner.
- Workspace creation and owner membership creation are handled in a transaction.

### WorkspaceMember

Stores users who belong to a workspace.

| Field | Type |
|---|---|
| id | String UUID |
| workspaceId | String |
| userId | String |
| role | WorkspaceRole |
| createdAt | DateTime |

**Available roles:**

- `OWNER`
- `ADMIN`
- `MEMBER`
- `VIEWER`

**Rules:**

- Duplicate memberships are prevented.
- A user can belong to many workspaces.
- A workspace can have many users.
- Owner membership is created automatically when a workspace is created.

### Note

Stores notes created inside a workspace.

| Field | Type |
|---|---|
| id | String UUID |
| title | String |
| content | String |
| workspaceId | String |
| createdBy | String |
| createdAt | DateTime |
| updatedAt | DateTime |

**Rules:**

- Notes belong to a workspace.
- Notes belong to a creator.
- Users can only access notes from workspaces where they are members.

---

## Role-Based Access Control

| Action | OWNER | ADMIN | MEMBER | VIEWER |
|---|---|---|---|---|
| Create workspace | ✅ | ✅ | ✅ | ✅ |
| View own workspaces | ✅ | ✅ | ✅ | ✅ |
| Update workspace | ✅ | ✅ | ❌ | ❌ |
| Delete workspace | ✅ | ❌ | ❌ | ❌ |
| Add members | ✅ | ✅ | ❌ | ❌ |
| Add another ADMIN | ✅ | ❌ | ❌ | ❌ |
| Change member roles | ✅ | ❌ | ❌ | ❌ |
| Remove members | ✅ | Limited | ❌ | ❌ |
| Create notes | ✅ | ✅ | ✅ | ❌ |
| View notes | ✅ | ✅ | ✅ | ✅ |
| Update notes | ✅ | ✅ | Creator only if still MEMBER | ❌ |
| Delete notes | ✅ | ✅ | Creator only if still MEMBER | ❌ |

---

## Tenant Isolation

Tenant isolation is one of the most important parts of this project.

Each workspace acts as a separate tenant. Workspace-related data must always be filtered using `workspaceId` or through the authenticated user's workspace membership.

**Bad example:**

```ts
return this.prisma.note.findMany();
```

**Good example:**

```ts
return this.prisma.note.findMany({
  where: {
    workspaceId,
  },
});
```

For record-level operations such as updating or deleting notes and members, the system should not reveal whether a resource exists in another tenant.

For example, if a user from another workspace tries to update a note by ID, the API should return `404 Not Found` instead of revealing that the note exists with a `403 Forbidden`.

---

## Authentication Flow

1. User registers using:
   ```
   POST /auth/register
   ```
2. Password is hashed using bcrypt.
3. User logs in using:
   ```
   POST /auth/login
   ```
4. Server returns a JWT access token.
5. Protected routes require the token in the `Authorization` header:
   ```
   Authorization: Bearer ACCESS_TOKEN
   ```

---

## Environment Variables

Create a `.env` file in the project root.

Because Docker exposes PostgreSQL from container port `5432` to host port `5433`, the `DATABASE_URL` must use `localhost:5433`.

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/workspace_db?schema=public"

JWT_SECRET="my_super_secret_workspace_key_123456"
JWT_EXPIRES_IN_SECONDS="86400"

PORT=3000
```

> **Important:**
> - Docker container port: `5432`
> - Host machine port: `5433`
> - Application uses: `localhost:5433`

---

## Docker Setup

The project uses PostgreSQL through Docker.

Use the following `docker-compose.yml`:

```yaml
services:
  postgres:
    image: postgres:16
    container_name: workspace-postgres
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: workspace_db
    ports:
      - "5433:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

**Start PostgreSQL:**

```bash
docker compose up -d
```

**Stop PostgreSQL:**

```bash
docker compose down
```

**Reset PostgreSQL including database volume** *(only when you want to delete all local database data):*

```bash
docker compose down -v
docker compose up -d
```

**Check running containers:**

```bash
docker ps
```

Expected result should show PostgreSQL running with port mapping similar to:

```
0.0.0.0:5433->5432/tcp
```

---

## Project Setup Instructions

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd <project-folder-name>
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create the `.env` file

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/workspace_db?schema=public"

JWT_SECRET="my_super_secret_workspace_key_123456"
JWT_EXPIRES_IN_SECONDS="86400"

PORT=3000
```

### 4. Start PostgreSQL using Docker

```bash
docker compose up -d
```

### 5. Generate Prisma client

```bash
npx prisma generate
```

### 6. Run Prisma migration

```bash
npx prisma migrate dev --name init
```

If migrations already exist, use:

```bash
npx prisma migrate dev
```

### 7. Start the development server

```bash
npm run start:dev
```

The server runs on:

```
http://localhost:3000
```

---

## Useful Commands

```bash
# Start the backend in development mode
npm run start:dev

# Build the project
npm run build

# Run linting
npm run lint

# Format the code
npm run format

# Run unit tests
npm run test

# Run end-to-end tests
npm run test:e2e

# Generate Prisma client
npx prisma generate

# Create and apply a new migration
npx prisma migrate dev --name migration_name

# Apply existing migrations
npx prisma migrate dev

# Open Prisma Studio
npx prisma studio

# Start Docker PostgreSQL
docker compose up -d

# Stop Docker PostgreSQL
docker compose down
```

---

## API Response Format

Most successful responses follow this format:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

**Example:**

```json
{
  "success": true,
  "message": "Workspace created successfully",
  "data": {
    "id": "workspace-id",
    "name": "EFutures Workspace",
    "slug": "efutures-workspace",
    "ownerId": "user-id"
  }
}
```

---

## Automated Testing

This project includes automated testing using Jest and Supertest.

The e2e tests are located inside the `test/` folder:

```text
test/
├── jest-e2e.json
└── workspace-system.e2e-spec.ts
```

### Running E2E Tests

Before running tests, make sure PostgreSQL is running:

```bash
docker compose up -d
```

Apply Prisma migrations:

```bash
npx prisma migrate dev
```

Run the e2e test suite:

```bash
npm run test:e2e
```

### Important Testing Note

The current Docker setup uses one local PostgreSQL database: `workspace_db`

For safer testing, it is recommended to add a separate test database before running cleanup-heavy e2e tests.

Until a dedicated test database is added, **do not run e2e tests against a production or important local database.**

### Recommended Test Database Setup

To avoid deleting development data during e2e testing, create a separate test environment.

**1. Create `.env.test`:**

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/workspace_test_db?schema=public"

JWT_SECRET="test_secret_key"
JWT_EXPIRES_IN_SECONDS="86400"

PORT=3001
```

**2. Create the test database manually:**

Connect to PostgreSQL and create a separate database:

```bash
docker exec -it workspace-postgres psql -U postgres
```

Inside the PostgreSQL shell:

```sql
CREATE DATABASE workspace_test_db;
```

Exit:

```
\q
```

**3. Install dotenv CLI:**

```bash
npm install -D dotenv-cli
```

**4. Update `package.json`:**

```json
{
  "scripts": {
    "test:e2e": "dotenv -e .env.test -- jest --config ./test/jest-e2e.json --runInBand",
    "test:e2e:migrate": "dotenv -e .env.test -- prisma migrate deploy"
  }
}
```

**5. Apply migrations to the test database:**

```bash
npm run test:e2e:migrate
```

**6. Run e2e tests:**

```bash
npm run test:e2e
```

This ensures test cleanup affects only `workspace_test_db`, not the development database.

### Test Coverage

| Area | Covered |
|---|---|
| User registration | ✅ |
| User login | ✅ |
| Password is not returned in response | ✅ |
| JWT protected routes | ✅ |
| Workspace creation | ✅ |
| Automatic owner membership creation | ✅ |
| Get user workspaces | ✅ |
| Add workspace members | ✅ |
| Prevent duplicate memberships | ✅ |
| Member permission restrictions | ✅ |
| Notes creation | ✅ |
| Notes reading | ✅ |
| Viewer cannot create notes | ✅ |
| Outsider cannot access workspace notes | ✅ |
| Owner can update notes | ✅ |
| Owner can update member roles | ✅ |
| Member cannot delete workspace | ✅ |
| Owner can delete notes | ✅ |

**Recommended additional edge-case tests:**

| Area | Required Improvement |
|---|---|
| Admin adding admin | Admin should not be able to add another admin |
| Downgraded creator | A note creator downgraded to VIEWER should not update/delete notes |
| Tenant isolation for notes | Outsider should receive 404 for another tenant's note ID |
| Tenant isolation for members | Outsider should receive 404 for another tenant's member ID |
| Test DB safety | E2E cleanup should run only against a dedicated test database |

---

## Logging

The project includes a custom request logging middleware located at:

```
src/common/middleware/request-logger.middleware.ts
```

It logs each incoming HTTP request after the response is completed.

**Log format:**

```
METHOD URL STATUS_CODE - RESPONSE_TIME
```

**Example logs:**

```
POST /auth/register 201 - 313ms
POST /auth/login 201 - 325ms
POST /workspaces 201 - 39ms
GET /workspaces 200 - 12ms
POST /workspaces/{workspaceId}/members 201 - 43ms
POST /workspaces 401 - 2ms
```

These logs help debug:

- Authentication issues
- Authorization failures
- RBAC behavior
- Request duration
- Endpoint usage
- Failed requests

---

## Postman Testing Guide

**Base URL:** `http://localhost:3000`

### 1. Register Owner User

```
POST /auth/register
```

Body:

```json
{
  "name": "Owner User",
  "email": "owner@example.com",
  "password": "password123"
}
```

Copy the returned `accessToken`.

### 2. Login Owner User

```
POST /auth/login
```

Body:

```json
{
  "email": "owner@example.com",
  "password": "password123"
}
```

### 3. Create Workspace

```
POST /workspaces
Authorization: Bearer OWNER_TOKEN
```

Body:

```json
{
  "name": "EFutures Workspace",
  "slug": "efutures-workspace"
}
```

Copy the returned workspace `id`.

### 4. Get My Workspaces

```
GET /workspaces
Authorization: Bearer OWNER_TOKEN
```

### 5. Register Member User

```
POST /auth/register
```

Body:

```json
{
  "name": "Member User",
  "email": "member@example.com",
  "password": "password123"
}
```

### 6. Add Member to Workspace

```
POST /workspaces/WORKSPACE_ID/members
Authorization: Bearer OWNER_TOKEN
```

Body:

```json
{
  "email": "member@example.com",
  "role": "MEMBER"
}
```

### 7. Register Viewer User

```
POST /auth/register
```

Body:

```json
{
  "name": "Viewer User",
  "email": "viewer@example.com",
  "password": "password123"
}
```

### 8. Add Viewer to Workspace

```
POST /workspaces/WORKSPACE_ID/members
Authorization: Bearer OWNER_TOKEN
```

Body:

```json
{
  "email": "viewer@example.com",
  "role": "VIEWER"
}
```

### 9. Create Note as Owner

```
POST /workspaces/WORKSPACE_ID/notes
Authorization: Bearer OWNER_TOKEN
```

Body:

```json
{
  "title": "First Workspace Note",
  "content": "This note belongs only to this workspace."
}
```

Copy the returned note `id`.

### 10. Get Workspace Notes

```
GET /workspaces/WORKSPACE_ID/notes
Authorization: Bearer OWNER_TOKEN
```

### 11. Login Member User

```
POST /auth/login
```

Body:

```json
{
  "email": "member@example.com",
  "password": "password123"
}
```

Copy the returned token as `MEMBER_TOKEN`.

### 12. Create Note as Member

```
POST /workspaces/WORKSPACE_ID/notes
Authorization: Bearer MEMBER_TOKEN
```

Body:

```json
{
  "title": "Member Note",
  "content": "This note was created by a member."
}
```

**Expected result:** Success. `MEMBER` can create notes.

### 13. Login Viewer User

```
POST /auth/login
```

Body:

```json
{
  "email": "viewer@example.com",
  "password": "password123"
}
```

Copy the returned token as `VIEWER_TOKEN`.

### 14. Try to Create Note as Viewer

```
POST /workspaces/WORKSPACE_ID/notes
Authorization: Bearer VIEWER_TOKEN
```

Body:

```json
{
  "title": "Viewer Note",
  "content": "Viewer should not be allowed to create this note."
}
```

**Expected result:**

```json
{
  "message": "You do not have permission for this action",
  "error": "Forbidden",
  "statusCode": 403
}
```

### 15. Get Notes as Viewer

```
GET /workspaces/WORKSPACE_ID/notes
Authorization: Bearer VIEWER_TOKEN
```

**Expected result:** Success. `VIEWER` can read notes but cannot create them.

### 16. Update Note as Owner

```
PATCH /notes/NOTE_ID
Authorization: Bearer OWNER_TOKEN
```

Body:

```json
{
  "title": "Updated Workspace Note",
  "content": "The owner updated this note."
}
```

### 17. Delete Note as Owner

```
DELETE /notes/NOTE_ID
Authorization: Bearer OWNER_TOKEN
```

### 18. Update Workspace as Owner

```
PATCH /workspaces/WORKSPACE_ID
Authorization: Bearer OWNER_TOKEN
```

Body:

```json
{
  "name": "Updated EFutures Workspace"
}
```

### 19. Try to Delete Workspace as Member

```
DELETE /workspaces/WORKSPACE_ID
Authorization: Bearer MEMBER_TOKEN
```

**Expected result:**

```json
{
  "message": "You do not have permission for this action",
  "error": "Forbidden",
  "statusCode": 403
}
```

### 20. Delete Workspace as Owner

> Use this only at the end of testing.

```
DELETE /workspaces/WORKSPACE_ID
Authorization: Bearer OWNER_TOKEN
```

---

## Common Errors

### Database connection error

**Example:**

```
Can't reach database server at localhost:5432
```

**Cause:** The application is trying to connect to port `5432`, but Docker exposes PostgreSQL on host port `5433`.

**Fix:** Update `.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/workspace_db?schema=public"
```

### Login method error

```json
{
  "message": "Cannot GET /auth/login",
  "error": "Not Found",
  "statusCode": 404
}
```

**Fix:** Use `POST /auth/login`, not `GET /auth/login`.

### Protected route error

```json
{
  "message": "Unauthorized",
  "statusCode": 401
}
```

**Common causes:**

- Token is missing.
- Token is invalid.
- Token is expired.
- Authorization type is not set to Bearer Token.

### Permission error

```json
{
  "message": "You do not have permission for this action",
  "error": "Forbidden",
  "statusCode": 403
}
```

**Cause:** The user is authenticated but does not have the required workspace role.

### User not found error

```json
{
  "message": "User not found",
  "error": "Not Found",
  "statusCode": 404
}
```

**Cause:** Trying to add a member email that is not registered in the system.

---

## Git Workflow

This project should be maintained inside a proper Git repository with regular commits.

**Initialize Git:**

```bash
git init
```

**Check current status:**

```bash
git status
```

**Add files:**

```bash
git add .
```

**Commit changes:**

```bash
git commit -m "Initial project setup"
```

**Recommended commit order:**

```bash
git add README.md docker-compose.yml
git commit -m "Fix README setup instructions and PostgreSQL port"

git add .
git commit -m "Fix linting and formatting issues"

git add tsconfig.json eslint.config.mjs
git commit -m "Enable strict TypeScript and unsafe any lint rules"

git add src/members src/notes
git commit -m "Fix RBAC and tenant isolation edge cases"

git add test .env.test package.json
git commit -m "Add safe e2e test database setup and edge case tests"
```

---

## Future Improvements

- [ ] Dedicated test database setup
- [ ] Stronger tenant isolation for record-level routes
- [ ] RBAC edge-case tests
- [ ] Pagination for notes
- [ ] Search and filtering
- [ ] Invitation system
- [ ] Activity logs
- [ ] Soft delete
- [ ] Redis caching
- [ ] Docker support for full backend application
