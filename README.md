# Data Narrator

## City Science Lab

<p align="center">
<img src="https://user-images.githubusercontent.com/36763878/219619895-12db4431-32d9-458b-a73f-548052404258.png" alt="Data Narrator logo" />
</p>

The Data Narrator Platform is a story-driven geospatial application for creating, editing and playing narrative map
experiences. It combines 2D and 3D map views with text, images, GeoJSON, WMS layers, 3D layers and interactive map
states so complex urban data can be communicated step by step.

This repository specifically contains the **Data Narrator backend**. Its role in the platform is to provide story
persistence, file handling, API endpoints and application-side integration logic for the frontend running inside
Masterportal.

## Repository roles

| Repository | Role |
|---|---|
| [`cut-dana-platform-addon`](https://github.com/citysciencelab/cut-dana-platform-addon) | Frontend add-on for the Data Narrator UI and story workflow inside Masterportal |
| [`cut-dana-platform-mp`](https://github.com/citysciencelab/cut-dana-platform-mp) | Masterportal-based map client that hosts and integrates the add-on |
| [`cut-dana-platform-backend`](https://github.com/citysciencelab/cut-dana-platform-backend) | Backend service for story persistence, files, API access and application data |
| [`cut-dana-platform-docker`](https://github.com/citysciencelab/cut-dana-platform-docker) | Docker-based local and deployment setup for running the full platform stack |

## Role of this repository

`cut-dana-platform-backend` is the service layer of the Data Narrator Platform. It exposes the APIs used by the
frontend, stores story data, manages uploaded files and supports authentication-related application setup. It is not
the deployment repository and not the map client itself.

## Development

Install dependencies:

```bash
bun install
```

Run the backend:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.1.24. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.

## Prisma

Environment variables declared in `.env` file are automatically made available to Prisma.

### Apply migrations to database

```bash
bunx prisma migrate dev
```

### Reset database

```bash
bunx prisma migrate reset
```

### FAQ:

* If prisma has a lock issue:

```sql
SELECT pg_terminate_backend(PSA.pid)
FROM pg_locks AS PL
    INNER JOIN pg_stat_activity AS PSA ON PSA.pid = PL.pid
WHERE PSA.state LIKE 'idle'
    AND PL.objid IN (72707369);
```

* Insert default dev keycloak configuration:

```sql
INSERT INTO "KeycloakSetup" ("authUri", "tokenUri", "clientId", "scope", "redirectUri") VALUES (
  'https://auth.cut-dana-platform.local/auth/realms/masterportal/protocol/openid-connect/auth',
  'https://auth.cut-dana-platform.local/auth/realms/masterportal/protocol/openid-connect/token',
  'masterportal-client',
  'profile email openid',
  'https://app.cut-dana-platform.local/portal/stories'
);
```
