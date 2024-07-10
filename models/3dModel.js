
import {Schema} from "mongoose";

const positionSchema = new Schema({
        x: Number,
        y: Number,
        z: Number
    }),

    orientationSchema = new Schema({
        heading: Number,
        roll: Number,
        pitch: Number
    }),

    // file describes the file type
    threeDModelSchema = new Schema({
        id: String,
        name: String,
        url: String,
        file: String
    });

threeDModelSchema.add({
    children: [threeDModelSchema]
});

export {
    threeDModelSchema,
    orientationSchema,
    positionSchema
};