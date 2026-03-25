import express from "express";
import cors from "cors";
import errorHandler from "./middlewares/errorHandlingMiddleware.ts";
import storyRouter from "./routes/Story/story.routes.ts";
import { setupLogger } from './utils/logger';

const localOnly = process.env.LOCAL_ONLY_DB === 'true';

const { default: fileRoutes } = localOnly ? { default: null } : await import("./routes/files");
const { default: authRouter } = localOnly ? { default: null } : await import("./routes/login.ts");
const { default: meRouter } = localOnly ? { default: null } : await import("./routes/me.ts");
const { default: userRouter } = localOnly ? { default: null } : await import("./routes/user.ts");

import "./extensions/RequestExtension.ts";

const app = express();
const port = 8000;

const logger = setupLogger({ label: 'backend:prepare' });

if (!localOnly) {
  if (process.env.KEYCLOAK_URL == null || process.env.KEYCLOAK_URL == ""
    || process.env.KEYCLOAK_CLIENT_ID == null || process.env.KEYCLOAK_CLIENT_ID == ""
    || process.env.KEYCLOAK_CLIENT_SECRET == null || process.env.KEYCLOAK_CLIENT_SECRET == "") {
    throw new Error("keycloak env vars not set");
  }
}

const HARD_TIMEOUT_MS = 15000;

const envKeys = [ 'DATABASE_URL', 'DATABASE_USER', 'DATABASE_HOST',
  'DATABASE_PORT', 'DATABASE_DB', 'KEYCLOAK_URL', 'DEBUG', 'KEYCLOAK_REALM', 'KEYCLOAK_CLIENT_ID',
  'KEYCLOAK_CLIENT_SECRET', 'KEYCLOAK_FRONTEND_CLIENT_ID', 'USE_AUTHENTICATION', 'MINIO_BUCKET', 'MINIO_ENDPOINT',
  'MINIO_USE_SSL', 'MINIO_PORT', 'MINIO_ACCESS_KEY', 'MINIO_SECRET_KEY', 'FRONTEND_URI'
];

const sensitiveEnvKeys = [ 'DATABASE_URL', 'DATABASE_PASSWORD', 'KEYCLOAK_CLIENT_SECRET', 'MINIO_SECRET_KEY' ];

logger.info('----------------------------------------');
logger.info(`🚀 cut-dana-platform-backend listening at localhost:${port}`);
logger.info('📦 Environment variables loaded:');
envKeys.forEach((key) => {
  let value = process.env[key];
  if (sensitiveEnvKeys.includes(key) && value != null) {
    value = '********';
  }
  logger.debug(`🌐 ${key}: ${value}`);
});
logger.info('----------------------------------------');

if (localOnly) {
  logger.warn('⚠️  LOCAL_ONLY_DB mode enabled — Keycloak & Minio are disabled');
}

app.use((req, res, next) => {
  const timer = setTimeout(() => {
    if (!res.headersSent) {
      logger.error(`Timed out: ${req.method} ${req.originalUrl}`);
      res.status(504).json({ message: "Gateway timeout" });
    }
  }, HARD_TIMEOUT_MS);
  res.on("finish", () => clearTimeout(timer));
  res.on("close", () => clearTimeout(timer));
  next();
});

app.use(cors())
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true }));

app.use('/stories', storyRouter);

if (!localOnly) {
  app.use("/files", fileRoutes!);
  app.use("/auth", authRouter!);
  app.use("/me", meRouter!);
  app.use("/users", userRouter!);
} else {
  // Mock /me endpoint for local development
  app.use("/me", (req, res) => {
    res.json({
      id: "69",
      username: "dev-user",
      email: "dev@local.test",
      roles: ["admin"]
    });
  });

  app.use("/users", (req, res) => {
    res.status(503).json({ message: "Users endpoint disabled in LOCAL_ONLY_DB mode" });
  });
}

app.use(errorHandler);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  logger.info(`Listening on port ${port}...`);
});

export default app;
