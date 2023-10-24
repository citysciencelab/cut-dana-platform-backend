import mime from "mime-types";
import multer from "multer";
import multerS3 from "multer-s3";

import { s3client } from "../models/image.js";


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
