import {Schema} from "mongoose";


export const layerSchema = new Schema({
    id: String,
    transparency: Number,
    selectionIDX: Number
});

