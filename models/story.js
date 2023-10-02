import {model, Schema} from "mongoose";
import {parse} from "node-html-parser";
import {stripHtml} from "string-strip-html";
import sanitizeHtml from "sanitize-html";

import {stepSchema, sanitizeOptions} from "./step.js";
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
        checkTitleImage (newTitleImage) {
            const oldTitleImage = this.images.find((image) => image.titleImage);

            if (oldTitleImage && newTitleImage !== oldTitleImage.location) {
                deleteImagesFromS3([oldTitleImage]);
                return "";
            }
            return [newTitleImage, oldTitleImage];

        },
        prepareHtml (html) {
            const root = parse(sanitizeHtml(html, sanitizeOptions));

            root.getElementsByTagName("img").forEach((img) => {
                const imgId = img.getAttribute("id") || img.getAttribute("src");

                if (imgId) {
                    const image = this.images.find((candidate) => candidate.hash === imgId);

                    if (image) {
                        img.setAttribute("id", img.getAttribute("src"));
                        img.setAttribute("src", image.location);
                    }
                }
            });
            return root.toString();
        }
    }
});

storySchema.pre("save", function (next) {
    // console.log(stripHtml(this.title).result.trim());
    this.title = stripHtml(this.title).result.trim();
    this.description = stripHtml(this.description).result.trim();
    this.author = stripHtml(this.author).result.trim();
    this.displayType = stripHtml(this.displayType || "classic").result.trim();
    this.chapters = this.chapters.map((chapter) => {
        chapter.chapterTitle = stripHtml(chapter.chapterTitle).result.trim();
        return chapter;
    });
    next();
});

// eslint-disable-next-line one-var
const Story = model("Story", storySchema);

export {Story, storySchema};
