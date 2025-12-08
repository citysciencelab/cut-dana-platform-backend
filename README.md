# story-backend

To install dependencies:

```bash
bun install
```

To run:

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