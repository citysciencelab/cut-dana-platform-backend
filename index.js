import "dotenv/config";
import {connect} from "mongoose";
import app from "./server.js";
import fs from "fs";
import https from "https";

// Read SSL certificate and key files
const key = fs.readFileSync("/etc/ssl/private/mykey.pem", "utf8"),
    cert = fs.readFileSync("/etc/ssl/certs/mycert.pem", "utf8"),

    httpsOptions = {
        key: key,
        cert: cert
    };

// eslint-disable-next-line no-process-env
// connect(process.env.MONGODB_URI);

// Connect to MongoDB

// eslint-disable-next-line no-process-env
connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("Connected to MongoDB");

        // Create HTTPS server
        https.createServer(httpsOptions, app).listen(443, () => {
            console.log("Server is running on port 443");
        });
    })
    .catch(err => {
        console.error("MongoDB connection error:", err);
    });

// eslint-disable-next-line no-process-env
console.log(process.env.MONGODB_URI);
app.listen(80);
