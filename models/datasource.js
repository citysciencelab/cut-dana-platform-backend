import {Schema} from "mongoose";
import {stripHtml} from "string-strip-html";

const datasourceSchema = new Schema({
    name: String,
    key: {
        type: String,
        required: true,
        index: true
    }
});

datasourceSchema.pre("save", function (next) {
    this.name = stripHtml(this.name).result.trim();
    next();
});

export {datasourceSchema};
