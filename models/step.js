import {Schema} from "mongoose";
import sanitizeHtml from "sanitize-html";
import {stripHtml} from "string-strip-html";

export const stepSchema = new Schema({
    stepNumber: Number,
    stepWidth: Number,
    visible: Boolean,
    associatedChapter: Number,
    title: String,
    html: String,
    centerCoordinate: [Number],
    zoomLevel: Number,
    layers: [String],
    interactionAddons: [String],
    is3D: Boolean,
    navigation3D: {
        cameraPosition: [Number],
        heading: Number,
        pitch: Number
    }
});

// eslint-disable-next-line one-var
const sanitizeOptions = {
    allowedTags: ["b", "i", "em", "strong", "a", "img", "p", "br", "ul", "ol", "li", "h1", "h2", "h3", "h4", "h5", "h6",
        "blockquote", "code", "span"],
    allowedAttributes: {
        "a": ["href", "name", "target"],
        "img": ["src", "id", "alt", "title", "width", "height"],
        "*": ["class", "spellcheck", "style"]
    }
};

stepSchema.pre("save", function (next) {
    this.html = sanitizeHtml(this.html, sanitizeOptions);
    this.title = stripHtml(this.title).result.trim();
    next();
});
