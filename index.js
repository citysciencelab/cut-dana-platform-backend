import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import logger from "morgan";
import createError from "http-errors";

import routes from "./routes/routes.js";

const app = express();

app.use(logger("dev"));
app.use(cors({origin: "*"}));
app.use(express.json({limit: "25mb"}));
app.use(bodyParser.json());

app.use("/", routes);

// catch 404 and forward to error handler
app.use((request, response, next) => {
    next(createError(404, "Path not Found"));
});

// error handler
app.use((error, request, response, next) => {
    // Prisma Client can't find a record with the specified unique key
    if (error.code === "P2025") {
        error.status = 404;
    }

    const details = {error: error.message};

    switch (error.status) {
        case 404:
            response.status(404).json(details);
            break;
        default:
            if (request.app.get("env") === "development") {
                details.stack = error.stack;
            }
            response.status(error.status || 500).json(details);
    }
    next(error);
});

app.listen(3000);
