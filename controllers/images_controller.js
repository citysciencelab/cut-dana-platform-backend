import mime from "mime-types";
import multer from "multer";
import multerS3 from "multer-s3";
import createError from "http-errors";
import {parse} from "node-html-parser";

import {Story} from "../models/story.js";
import {s3client, deleteImagesFromS3} from "../models/image.js";

/* eslint-disable no-process-env */

/**
 * storing image files on disk
 *
 * @param {Object} request description
 * @param {Number} response description
 * @param {function} next description
 * @returns {void}
 */
// AFTER : Create multer object
// eslint-disable-next-line one-var
const imageUpload = multer({
    storage: multerS3({
        s3: s3client,
        acl: "public-read",
        bucket: process.env.AWS_BUCKET_NAME,
        key: function (req, file, cb) {
            cb(null, req.params.image_hash + "." + mime.extension(file.mimetype));
        }
    })
});


/**
 * Add uploaded image to story
 *
 * @param {Object} request description
 * @param {Number} response description
 * @param {function} next description
 * @returns {void}
 */
function addImagePath (request, response, next) {
    const fileMeta = fileMetaInfo(request),
        overwrites = {};


    Story.findById(request.params.story_id)
        .orFail(createError(404, "Story not found")).exec()
        .then((story) => {
            if (fileMeta.associatedChapter === 0 && fileMeta.stepNumber === 0) {
                // this is the story cover image
                overwrites.images = saveCoverImage(story, fileMeta);
                overwrites.titleImage = fileMeta.location;
            }
            else {
                // this is a step image
                const [stepFound, newSteps] = saveStepImage(story, fileMeta);

                if (!stepFound) {
                    throw createError(404, "Step not found");
                }
                overwrites.images = story.images;
                overwrites.steps = newSteps;
            }

            if (Object.keys(overwrites).length === 0) {
                throw createError(400, "Something went wrong");
            }
            story.set(overwrites).save();
            response.status(201).json({sucess: true, filepath: fileMeta.location});
        }).catch((err) => {
            next(err);
        });
}

/**
 * Extract and prepare image metadata
 * @param {Object} request passed from top-level function
 * @returns {Object} extracted file metadata
 */
function fileMetaInfo (request) {
    return {
        associatedChapter: parseInt(request.params.step_major, 10),
        stepNumber: parseInt(request.params.step_minor, 10),
        hash: request.params.image_hash,
        location: request.file.location,
        key: request.file.key
    };
}


/**
 * Add uploaded image to story
 * @param {Object} story processed story object
 * @param {Object} fileMeta extracted file metadata
 * @returns {Array} [stepFound, newSteps]
*/
function saveStepImage (story, fileMeta) {
    let stepFound = false;
    // replace the image link in the step html
    const newSteps = story.steps.map((step) => {
        if (step.associatedChapter === fileMeta.associatedChapter && step.stepNumber === fileMeta.stepNumber) {
            stepFound = true;

            // add this image into the story.images array
            story.images.push(fileMeta);

            const root = parse(step.html);

            root.getElementsByTagName("img").forEach((img) => {
                const src = img.getAttribute("src");

                if (src === fileMeta.hash) {
                    img.setAttribute("id", img.getAttribute("src"));
                    img.setAttribute("src", fileMeta.location);
                }
            });
            step.html = root.toString();
        }
        return step;
    });

    return [stepFound, newSteps];
}

/**
 * Add uploaded image to story
 * @param {Object} story processed story object
 * @param {Object} fileMeta extracted file metadata
 * @returns {Array} [newImages]
*/
function saveCoverImage (story, fileMeta) {
    let imageFound = false;
    const newImages = story.images.map((image) => {
        if (image.associatedChapter === 0 && image.stepNumber === 0) {
            deleteImagesFromS3([image]);
            imageFound = true;
            return fileMeta;
        }
        return image;
    });

    if (!imageFound) {
        newImages.push(fileMeta);
    }

    return newImages;
}

export {imageUpload, addImagePath};
