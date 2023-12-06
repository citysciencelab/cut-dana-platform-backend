
import {Schema} from "mongoose";

const positionSchema = new Schema({
        x: Number,
        y: Number,
        z: Number
    }),

    orientationSchema = new Schema({
        x: Number,
        y: Number,
        z: Number,
        w: Number
    }),

    // file describes the file type
    threeDModelSchema = new Schema({
        name: String,
        url: String,
        file: String,
        position: positionSchema,
        orientation: orientationSchema
    });

threeDModelSchema.add({
    children: [threeDModelSchema]
});

export {
    threeDModelSchema
};
