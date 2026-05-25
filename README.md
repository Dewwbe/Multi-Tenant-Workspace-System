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
- [API Response Format](#api-response-format)
- [Postman Testing Guide](#postman-testing-guide)
- [Git Commit Suggestions](#git-commit-suggestions)
- [Future Improvements](#future-improvements)

---

## Project Overview

The **Multi-Tenant Workspace System** is an advanced backend project built using **NestJS**, **TypeScript**, **Prisma**, and **PostgreSQL**.

This project simulates a real-world SaaS backend system where multiple users can create and manage workspaces. Each workspace acts as a separate tenant, and users can only access the data that belongs to the workspaces they are members of.

The main focus of this project is not only CRUD operations, but also backend architecture, workspace isolation, role-based access control, reusable authorization logic, and maintainable NestJS module design.

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

### Development Tools
- Docker
- Postman
- Prisma CLI
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
│   └── interfaces/
│       ├── auth-user.interface.ts
│       ├── authenticated-request.interface.ts
│       └── jwt-payload.interface.ts
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
| id | String (UUID) |
| name | String |
| email | String (unique) |
| password | String (hashed) |
| createdAt | DateTime |
| updatedAt | DateTime |

**Rules:**
- Email must be unique
- Password is hashed before saving
- Password is never returned in API responses

---

### Workspace

Represents a tenant or workspace.

| Field | Type |
|---|---|
| id | String (UUID) |
| name | String |
| slug | String (unique) |
| ownerId | String |
| createdAt | DateTime |
| updatedAt | DateTime |

**Rules:**
- Slug must be unique
- Workspace creator automatically becomes the owner

---

### WorkspaceMember

Stores users who belong to a workspace.

| Field | Type |
|---|---|
| id | String (UUID) |
| workspaceId | String |
| userId | String |
| role | WorkspaceRole |
| createdAt | DateTime |

**Available roles:** `OWNER` · `ADMIN` · `MEMBER` · `VIEWER`

**Rules:**
- Duplicate memberships are prevented
- A user can belong to many workspaces
- A workspace can have many users

---

### Note

Stores notes created inside a workspace.

| Field | Type |
|---|---|
| id | String (UUID) |
| title | String |
| content | String |
| workspaceId | String |
| createdBy | String |
| createdAt | DateTime |
| updatedAt | DateTime |

**Rules:**
- Notes belong to a workspace
- Notes belong to a creator
- Users can only access notes from their own workspace

---

## Role-Based Access Control

| Action | OWNER | ADMIN | MEMBER | VIEWER |
|---|:---:|:---:|:---:|:---:|
| Create workspace | ✅ | ✅ | ✅ | ✅ |
| Update workspace | ✅ | ✅ | ❌ | ❌ |
| Delete workspace | ✅ | ❌ | ❌ | ❌ |
| Add members | ✅ | ✅ | ❌ | ❌ |
| Change member roles | ✅ | ❌ | ❌ | ❌ |
| Remove members | ✅ | Limited | ❌ | ❌ |
| Create notes | ✅ | ✅ | ✅ | ❌ |
| View notes | ✅ | ✅ | ✅ | ✅ |
| Update notes | ✅ | ✅ | Creator only | ❌ |
| Delete notes | ✅ | ✅ | Creator only | ❌ |

---

## Tenant Isolation

Tenant isolation is one of the most important parts of this project. Each workspace acts as a separate tenant. All workspace-related data is filtered using `workspaceId`.

❌ **Bad example:**
```typescript
return this.prisma.note.findMany();
```

✅ **Good example:**
```typescript
return this.prisma.note.findMany({
  where: {
    workspaceId,
  },
});
```

This prevents users from accessing notes or resources from another workspace.

---

## Authentication Flow

1. User registers using `POST /auth/register`
2. Password is hashed using bcrypt
3. User logs in using `POST /auth/login`
4. Server returns a JWT access token
5. Protected routes require the token in the `Authorization` header

```
Authorization: Bearer ACCESS_TOKEN
```

---

## Environment Variables

Create a `.env` file in the project root:

```dotenv
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/workspace_db?schema=public"

JWT_SECRET="my_super_secret_workspace_key_123456"
JWT_EXPIRES_IN_SECONDS="86400"

PORT=3000
```

---

## Docker Setup

The project uses PostgreSQL through Docker.

**`docker-compose.yml`**
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
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

```bash
# Start PostgreSQL
docker compose up -d

# Stop PostgreSQL
docker compose down

# Reset PostgreSQL including database volume
docker compose down -v
docker compose up -d
```

---

## Project Setup Instructions

### 1. Install dependencies
```bash
npm install
```

### 2. Start PostgreSQL
```bash
docker compose up -d
```

### 3. Generate Prisma client
```bash
npx prisma generate
```

### 4. Run migration
```bash
npx prisma migrate dev --name init
```

### 5. Start development server
```bash
npm run start:dev
```

Server runs on: `http://localhost:3000`

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

---

## Postman Testing Guide

**Base URL:** `http://localhost:3000`

---

### 1. Register Owner User

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `http://localhost:3000/auth/register` |

```json
{
  "name": "Owner User",
  "email": "owner@example.com",
  "password": "password123"
}
```

> Copy the returned `accessToken`.

---

### 2. Login Owner User

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `http://localhost:3000/auth/login` |

```json
{
  "email": "owner@example.com",
  "password": "password123"
}
```

> No Bearer Token needed for login.

---

### 3. Create Workspace

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `http://localhost:3000/workspaces` |
| **Authorization** | Bearer Token: `OWNER_TOKEN` |

```json
{
  "name": "EFutures Workspace",
  "slug": "efutures-workspace"
}
```

> Copy the returned workspace `id`.

---

### 4. Get My Workspaces

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `http://localhost:3000/workspaces` |
| **Authorization** | Bearer Token: `OWNER_TOKEN` |

---

### 5. Register Member User

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `http://localhost:3000/auth/register` |

```json
{
  "name": "Member User",
  "email": "member@example.com",
  "password": "password123"
}
```

---

### 6. Add Member to Workspace

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `http://localhost:3000/workspaces/WORKSPACE_ID/members` |
| **Authorization** | Bearer Token: `OWNER_TOKEN` |

> Replace `WORKSPACE_ID` with the real workspace id.

```json
{
  "email": "member@example.com",
  "role": "MEMBER"
}
```

---

### 7. Register Viewer User

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `http://localhost:3000/auth/register` |

```json
{
  "name": "Viewer User",
  "email": "viewer@example.com",
  "password": "password123"
}
```

---

### 8. Add Viewer to Workspace

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `http://localhost:3000/workspaces/WORKSPACE_ID/members` |
| **Authorization** | Bearer Token: `OWNER_TOKEN` |

```json
{
  "email": "viewer@example.com",
  "role": "VIEWER"
}
```

---

### 9. Create Note as Owner

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `http://localhost:3000/workspaces/WORKSPACE_ID/notes` |
| **Authorization** | Bearer Token: `OWNER_TOKEN` |

```json
{
  "title": "First Workspace Note",
  "content": "This note belongs only to this workspace."
}
```

> Copy the returned note `id`.

---

### 10. Get Workspace Notes as Owner

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `http://localhost:3000/workspaces/WORKSPACE_ID/notes` |
| **Authorization** | Bearer Token: `OWNER_TOKEN` |

---

### 11. Login Member User

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `http://localhost:3000/auth/login` |

```json
{
  "email": "member@example.com",
  "password": "password123"
}
```

> Copy the returned token as `MEMBER_TOKEN`.

---

### 12. Create Note as Member

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `http://localhost:3000/workspaces/WORKSPACE_ID/notes` |
| **Authorization** | Bearer Token: `MEMBER_TOKEN` |

```json
{
  "title": "Member Note",
  "content": "This note was created by a member."
}
```

> **Expected result:** success — a member is allowed to create notes.

---

### 13. Login Viewer User

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `http://localhost:3000/auth/login` |

```json
{
  "email": "viewer@example.com",
  "password": "password123"
}
```

> Copy the returned token as `VIEWER_TOKEN`.

---

### 14. Try to Create Note as Viewer

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `http://localhost:3000/workspaces/WORKSPACE_ID/notes` |
| **Authorization** | Bearer Token: `VIEWER_TOKEN` |

```json
{
  "title": "Viewer Note",
  "content": "Viewer should not be allowed to create this note."
}
```

**Expected result — confirms RBAC is working:**
```json
{
  "message": "You do not have permission for this action",
  "error": "Forbidden",
  "statusCode": 403
}
```

---

### 15. Get Notes as Viewer

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `http://localhost:3000/workspaces/WORKSPACE_ID/notes` |
| **Authorization** | Bearer Token: `VIEWER_TOKEN` |

> **Expected result:** success — viewer can read notes but cannot create them.

---

### 16. Update Note as Owner

| | |
|---|---|
| **Method** | `PATCH` |
| **URL** | `http://localhost:3000/notes/NOTE_ID` |
| **Authorization** | Bearer Token: `OWNER_TOKEN` |

```json
{
  "title": "Updated Workspace Note",
  "content": "The owner updated this note."
}
```

---

### 17. Delete Note as Owner

| | |
|---|---|
| **Method** | `DELETE` |
| **URL** | `http://localhost:3000/notes/NOTE_ID` |
| **Authorization** | Bearer Token: `OWNER_TOKEN` |

---

### 18. Update Workspace as Owner

| | |
|---|---|
| **Method** | `PATCH` |
| **URL** | `http://localhost:3000/workspaces/WORKSPACE_ID` |
| **Authorization** | Bearer Token: `OWNER_TOKEN` |

```json
{
  "name": "Updated EFutures Workspace"
}
```

---

### 19. Try to Delete Workspace as Member

| | |
|---|---|
| **Method** | `DELETE` |
| **URL** | `http://localhost:3000/workspaces/WORKSPACE_ID` |
| **Authorization** | Bearer Token: `MEMBER_TOKEN` |

**Expected result — confirms only the owner can delete a workspace:**
```json
{
  "message": "You do not have permission for this action",
  "error": "Forbidden",
  "statusCode": 403
}
```

---

### 20. Delete Workspace as Owner

> ⚠️ Use this only at the end of testing.

| | |
|---|---|
| **Method** | `DELETE` |
| **URL** | `http://localhost:3000/workspaces/WORKSPACE_ID` |
| **Authorization** | Bearer Token: `OWNER_TOKEN` |

> **Expected result:** success.

---

## Common Errors

### Login method error
```json
{
  "message": "Cannot GET /auth/login",
  "error": "Not Found",
  "statusCode": 404
}
```
**Fix:** Use `POST /auth/login`, not `GET /auth/login`.

---

### Protected route error
```json
{
  "message": "Unauthorized",
  "statusCode": 401
}
```
**Causes:**
- Token is missing
- Token is invalid or expired
- Authorization type is not set to Bearer Token

---

### Permission error
```json
{
  "message": "You do not have permission for this action",
  "error": "Forbidden",
  "statusCode": 403
}
```
**Cause:** The user is authenticated but does not have the required workspace role.

---

## Git Commit Suggestions

```bash
git add .
git commit -m "Initialize NestJS backend project"

git add .
git commit -m "Add Prisma schema and database models"

git add .
git commit -m "Implement authentication with JWT"

git add .
git commit -m "Implement workspace and member management"

git add .
git commit -m "Implement notes with workspace isolation"

git add .
git commit -m "Add RBAC guards and permission logic"

git add .
git commit -m "Update README with setup and API testing guide"
```

---

## Future Improvements

- [ ] Swagger API documentation
- [ ] Unit tests using Jest
- [ ] E2E tests using Supertest
- [ ] Pagination for notes
- [ ] Search and filtering
- [ ] Invitation system
- [ ] Activity logs
- [ ] Soft delete
- [ ] Redis caching
- [ ] Docker support for the full backend application
