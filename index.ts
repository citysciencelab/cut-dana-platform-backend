import express from "express";
import fileRoutes from "./routes/files";
const app = express();
const port = 8000;

app.use("/files", fileRoutes);

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.listen(port, () => {
    console.log(`Listening on port ${port}...`);
});
