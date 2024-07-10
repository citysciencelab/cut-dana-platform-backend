import "dotenv/config";
import {connect} from "mongoose";
import app from "./server.js";

// eslint-disable-next-line no-process-env
connect(process.env.MONGODB_URI);
app.listen(80);
