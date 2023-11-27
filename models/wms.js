import {Schema} from "mongoose";


export const wmsSchema = new Schema({
    url: String,
    selectedLayers: [String]
});

