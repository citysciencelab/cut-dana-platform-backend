import express from "express";
import cors from "cors";
import fileRoutes from "./routes/files";
import authRouter from "./routes/login.ts";

const app = express();
const port = 8000;

app.use(cors())

app.use("/files", fileRoutes);
app.use("/auth", authRouter);

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.listen(port, () => {
    console.log(`Listening on port ${port}...`);
});
