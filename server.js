import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import logger from "morgan";
import createError from "http-errors";

import routes from "./routes/routes.js";
import {authMiddleware} from "./utils/authMiddleware.js";
import {errorHandlerMiddleware} from "./utils/errorHandlerMiddleware.js";

const app = express();

app.use(logger("dev"));
app.use(cors({origin: "*"}));
app.use(express.json({limit: "25mb"}));
app.use(bodyParser.json());

// Extract user info from token (if present)
app.use(authMiddleware);

app.use("/db/", routes);

// Redirect HTTP to HTTPS
app.use((req, res, next) => {
    if (!req.secure) {
        return res.redirect(`https://${req.headers.host}${req.url}`);
    }
    next();
});

// catch 404 and forward to error handler
app.use((request, response, next) => {
    console.log(request);
    next(createError(404, "Path not found!"));
});

// error handler
app.use(errorHandlerMiddleware);


export default app;
