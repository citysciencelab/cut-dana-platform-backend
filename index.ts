import express from "express";
import cors from "cors";
import fileRoutes from "./routes/files";
import authRouter from "./routes/login.ts";
import stepRouter from "./routes/step.ts";
import storyRouter from "./routes/story.ts";
import meRouter from "./routes/me.ts";
import userRouter from "./routes/user.ts";

const app = express();
const port = 8000;

app.use(cors())
app.use(express.json())

app.use("/files", fileRoutes);
app.use("/auth", authRouter);
app.use("/steps", stepRouter);
app.use("/stories", storyRouter);
app.use("/me", meRouter);
app.use("/users", userRouter);

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.listen(port, () => {
    console.log(`Listening on port ${port}...`);
});
