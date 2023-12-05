
import {Schema} from "mongoose";

export const positionSchema = new Schema({
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

    threeDModelSchema = new Schema({
        name: String,
        url: String,
        position: positionSchema,
        orientation: orientationSchema
    });

