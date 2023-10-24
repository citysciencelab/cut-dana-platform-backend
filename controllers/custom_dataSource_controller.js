import createError from "http-errors";
import mime from "mime-types";
import multer from "multer";
import multerS3 from "multer-s3";
import { fileMetaInfo } from "./images_controller.js";

import { s3client } from "../models/image.js";
import { Story } from "../models/story.js";


/**
 * storing files on S3
 *
 * @param {Object} request http request
 * @param {Object} response http response
 * @param {function} next description
 * @returns {void}
 */
// AFTER : Create multer object
// eslint-disable-next-line one-var
const fileUpload = multer({
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
 * Add uploaded file to story step
 *
 * @param {Object} request http request
 * @param {Object} response http response
 * @param {function} next description
 * @returns {void}
 */
function addFilePath (request, response, next) {
    Story.findById(request.params.story_id)
        .orFail(createError(404, "Story not found"))
        .then((story) => {
            if (story.owner !== request.user?.sub && request.isAdmin === false) {
                throw createError(403, "Forbidden");
            }
            const fileMeta = fileMetaInfo(request),
                operations = {
                    $push: {"steps.$.customLayers": fileMeta}
                };


            if (fileMeta.titleImage) {
                const oldTitleImage = story.checkTitleImage(fileMeta.location)[1];

                if (oldTitleImage) {
                    operations.$pull = {images: {hash: oldTitleImage.hash}};
                }
                operations.$set = {titleImage: fileMeta.location};
            }

            return Story.findOneAndUpdate({"_id": story.id, "steps.stepNumber": request.params.stepNumber}, operations).then(() => {
                response.status(201).json({sucess: true, filepath: fileMeta.location});
            });
        }).catch((err) => {
            next(err);
        });
}
