import "dotenv/config";
import {connect} from "mongoose";
import app from "./server.js";
const port = 3000;

// eslint-disable-next-line no-process-env
connect("mongodb+srv://datanarrator:lZHqFZS8U99B9xVj@cluster0.xqy6gwv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");
// eslint-disable-next-line no-process-env
console.log(process.env.MONGODB_URI);
console.log(port);
app.listen(port);
