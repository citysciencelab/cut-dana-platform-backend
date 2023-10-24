import createError from "http-errors";
import mime from "mime-types";
import multer from "multer";
import multerS3 from "multer-s3";

import { s3client } from "../models/image.js";
import { Story } from "../models/story.js";

import { unsplash } from "../utils/unsplash.js";

/* eslint-disable no-process-env */

/**
 * storing image files on disk
 *
 * @param {Object} request http request
 * @param {Object} response http response
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
 * @param {Object} request http request
 * @param {Object} response http response
 * @param {function} next description
 * @returns {void}
 */
function addImagePath (request, response, next) {
    Story.findById(request.params.story_id)
        .orFail(createError(404, "Story not found"))
        .then((story) => {
            if (story.owner !== request.user?.sub && request.isAdmin === false) {
                throw createError(403, "Forbidden");
            }
            const fileMeta = fileMetaInfo(request),
                operations = {
                    $push: {images: fileMeta}
                };

            if (fileMeta.titleImage) {
                const oldTitleImage = story.checkTitleImage(fileMeta.location)[1];

                if (oldTitleImage) {
                    operations.$pull = {images: {hash: oldTitleImage.hash}};
                }
                operations.$set = {titleImage: fileMeta.location};
            }

            return Story.findOneAndUpdate({"_id": story.id}, operations).then(() => {
                response.status(201).json({sucess: true, filepath: fileMeta.location});
            });
        }).catch((err) => {
            next(err);
        });
}

/**
 * Suggest images from unsplash
 *
 * @param {Object} request http request
 * @param {Object} response http response
 * @returns {void}
 */
function suggest (request, response) {
    unsplash.search.getPhotos({
        query: request.query.q,
        page: 1,
        perPage: 10,
        orientation: "landscape"
    }).then((results) => {
        const suggestion = results.response.results.map((result) => ({
            id: result.id,
            url: result.urls.regular,
            user: {
                id: result.user.id,
                name: result.user.name
            }
        }));

        return response.json(suggestion);
    }).catch(() => {
        return response.json([]);
    });
}

/**
 * Extract and prepare image metadata
 * @param {Object} request passed from top-level function
 * @returns {Object} extracted file metadata
 */
function fileMetaInfo (request) {
    return {
        titleImage: parseInt(request.params.step_major, 10) === 0 && parseInt(request.params.step_minor, 10) === 0,
        hash: request.params.image_hash,
        location: request.file.location,
        key: request.file.key
    };
}

export { addImagePath, fileMetaInfo, imageUpload, suggest };

