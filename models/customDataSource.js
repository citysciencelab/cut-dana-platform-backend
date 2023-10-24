import {Schema} from "mongoose";


export const customDataSourceSchema = new Schema({
    id: String,
    user: String,
    url: String
});

