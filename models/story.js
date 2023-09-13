import {model, Schema} from "mongoose";
import {stepSchema} from "./step.js";

const storySchema = new Schema({
        title: String,
        description: String,
        author: String,
        storyInterval: Number,
        titleImage: {
            type: String, // key
            required: false
        },
        chapters: [{
            chapterNumber: Number,
            chapterTitle: String
        }],
        steps: [stepSchema],
        createdAt: Date,
        updatedAt: {
            type: Date,
            required: false
        },
        publishedAt: {
            type: Date,
            required: false
        }
    }, {timestamps: true}),

    Story = model("Story", storySchema);

export {Story, storySchema};
