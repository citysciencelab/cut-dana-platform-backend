import express from "express";
import cors from "cors";
import fileRoutes from "./routes/files";
import authRouter from "./routes/login.ts";
import meRouter from "./routes/me.ts";
import userRouter from "./routes/user.ts";
import errorHandler from "./middlewares/errorHandlingMiddleware.ts";
import storyRouter from "./routes/Story/story.routes.ts";
import { setupLogger } from './utils/logger';

import "./extensions/RequestExtension.ts";

const app = express();
const port = 8000;

const logger = setupLogger({ label: 'backend:prepare' });

if (process.env.KEYCLOAK_URL == null || process.env.KEYCLOAK_URL == ""
    || process.env.KEYCLOAK_CLIENT_ID == null || process.env.KEYCLOAK_CLIENT_ID == ""
    || process.env.KEYCLOAK_CLIENT_SECRET == null || process.env.KEYCLOAK_CLIENT_SECRET == "") {
    throw new Error("keycloak env vars not set");
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

// TODO@JOREN: use asyncHandler in other routers too to make use of the error handler
app.use("/files", fileRoutes);
app.use("/auth", authRouter);
app.use('/stories', storyRouter);
app.use("/me", meRouter);
app.use("/users", userRouter);

app.use(errorHandler);

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.listen(port, () => {
    logger.info(`Listening on port ${port}...`);
});

export default app;
