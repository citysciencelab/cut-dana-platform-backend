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


if prisma lock issue:

```sql
SELECT pg_terminate_backend(PSA.pid)
FROM pg_locks AS PL
    INNER JOIN pg_stat_activity AS PSA ON PSA.pid = PL.pid
WHERE PSA.state LIKE 'idle'
    AND PL.objid IN (72707369);
```
