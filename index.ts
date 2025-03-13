import express from "express";
import cors from "cors";
import fileRoutes from "./routes/files";
import authRouter from "./routes/login.ts";
import stepRouter from "./routes/step.ts";
import meRouter from "./routes/me.ts";
import userRouter from "./routes/user.ts";
import errorHandler from "./middlewares/errorHandlingMiddleware.ts";
import chapterRouter from "./routes/Story/chapter.routes.ts";
import storyRouter from "./routes/Story/story.routes.ts";

const app = express();
const port = 8000;

if (process.env.KEYCLOAK_URL == null || process.env.KEYCLOAK_URL == ""
    || process.env.KEYCLOAK_CLIENT_ID == null || process.env.KEYCLOAK_CLIENT_ID == ""
    || process.env.KEYCLOAK_CLIENT_SECRET == null || process.env.KEYCLOAK_CLIENT_SECRET == "") {
    throw new Error("keycloak env vars not set");
}

app.use(cors())
app.use(express.json({ limit: "10mb"}))
app.use(express.urlencoded({ extended: true }));


// TODO@JOREN: use asyncHandler in other routers too to make use of the error handler
app.use("/files", fileRoutes);
app.use("/auth", authRouter);
app.use("/steps", stepRouter);
app.use('/stories', storyRouter);
app.use('/stories', chapterRouter);
app.use('/stories', stepRouter);
app.use("/me", meRouter);
app.use("/users", userRouter);

app.use(errorHandler);

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.listen(port, () => {
    console.log(`Listening on port ${port}...`);
});
