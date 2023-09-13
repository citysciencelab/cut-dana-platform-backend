import {Schema} from "mongoose";

export const stepSchema = new Schema({
    stepNumber: Number,
    stepWidth: Number,
    visible: Boolean,
    associatedChapter: Number,
    title: String,
    html: String,
    centerCoordinate: {
        lat: Number,
        lng: Number
    },
    zoomLevel: Number,
    // layers: [],
    // interactionAddons:[],
    is3D: Boolean
    // navigation3D: {
    //     cameraPosition:[null,null,null],
    //     heading:null,
    //     pitch: null
    // }
    // images: [{
    //     type: String, // key
    //     required: false
    // }]
});
