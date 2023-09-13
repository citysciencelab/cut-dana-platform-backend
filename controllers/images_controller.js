import mime from "mime-types";
import multer from "multer";
import multerS3 from "multer-s3";
import createError from "http-errors";
import {Image, s3client} from "../models/image.js";

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

/* eslint-enable no-process-env */

/**
 * Retrieves image by id from database
 *
 * @param {Object} request description
 * @param {Number} response description
 * @param {function} next description
 * @returns {void}
 */
function getImageById (request, response, next) {
    Image.findOne({hash: request.params.image_hash}, "location")
        .orFail(createError(404, "Image not found")).exec()
        .then((image) => {
            response.status(301).redirect(image.location);
        }).catch((err) => {
            next(err);
        });
}


/**
 * description
 *
 * @param {Object} request description
 * @param {Number} response description
 * @param {function} next description
 * @returns {void}
 */
function addImagePath (request, response, next) {
    const filepath = request.file.location;

    Image.create({
        story_id: request.params.story_id,
        step_major: request.params.step_major,
        step_minor: request.params.step_minor,
        hash: request.params.image_hash,
        location: filepath,
        key: request.file.key
    }).then(() => {
        response.status(201).json({sucess: true, filepath});
    }).catch((err) => {
        next(err);
    });
}

export {imageUpload, getImageById, addImagePath};
