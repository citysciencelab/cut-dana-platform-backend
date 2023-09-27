import {model, Schema} from "mongoose";
import {parse} from "node-html-parser";
import {stripHtml} from "string-strip-html";

import {stepSchema} from "./step.js";
import {imageSchema, deleteImagesFromS3} from "./image.js";

const storySchema = new Schema({
    title: String,
    description: String,
    author: String,
    storyInterval: Number,
    titleImage: {
        type: String, // key
        required: false
    },
    displayType: String,
    chapters: [{
        chapterNumber: Number,
        chapterTitle: String
    }],
    steps: [stepSchema],
    images: [imageSchema],
    createdAt: Date,
    updatedAt: {
        type: Date,
        required: false
    },
    publishedAt: {
        type: Date,
        required: false
    }
}, {
    timestamps: true,
    methods: {
        checkTitleImage (newStory, usedImages, usedImageIds) {
            this.images.every((image) => {
                if (image.associatedChapter === 0 && image.stepNumber === 0) {
                    if (this.titleImage && newStory.titleImage !== this.titleImage) {
                        newStory.titleImage = "";
                        deleteImagesFromS3([image]);
                    }
                    else {
                        newStory.titleImage = this.titleImage;
                        usedImageIds.push(image.hash);
                        usedImages.push(image);
                    }
                    return false;
                }
                return true;
            });
        },
        prepareSteps (newStory, usedImages, usedImageIds) {
            return newStory.steps.map((step) => {
                const newStep = {...step},
                    root = parse(newStep.html);

                root.getElementsByTagName("img").forEach((img) => {
                    const imgId = img.getAttribute("id") || img.getAttribute("src");

                    if (imgId) {
                        const image = this.images.find((candidate) => {
                            return candidate.hash === imgId;
                        });

                        if (image) {
                            image.associatedChapter = newStep.associatedChapter;
                            image.stepNumber = newStep.stepNumber;
                            usedImages.push(image);
                            usedImageIds.push(image.hash);
                        }
                    }
                });
                newStep.html = root.toString();
                return newStep;
            });
        }
    }
});

storySchema.pre("save", function (next) {
    // console.log(stripHtml(this.title).result.trim());
    this.title = stripHtml(this.title).result.trim();
    this.description = stripHtml(this.description).result.trim();
    this.author = stripHtml(this.author).result.trim();
    this.displayType = stripHtml(this.displayType).result.trim();
    this.chapters = this.chapters.map((chapter) => {
        chapter.chapterTitle = stripHtml(chapter.chapterTitle).result.trim();
        return chapter;
    });
    next();
});

// eslint-disable-next-line one-var
const Story = model("Story", storySchema);

export {Story, storySchema};
