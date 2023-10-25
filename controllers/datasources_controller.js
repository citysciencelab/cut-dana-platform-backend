import multer from "multer";
import multerS3 from "multer-s3";
import createError from "http-errors";
import {formatUrl} from "@aws-sdk/util-format-url";

import {Story} from "../models/story.js";
import {getSignedUrl} from "../models/datasource.js";
import {s3client} from "../models/image.js";
import {defaultQuery} from "../utils/queryBuilder.js";


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
const datasourceUpload = multer({
    storage: multerS3({
        s3: s3client,
        acl: "private",
        bucket: process.env.AWS_BUCKET_NAME,
        key: function (req, file, cb) {
            cb(null, req.params.datasource_hash);
        }
    })
});

/**
 * Returns all the structure of the story
 *
 * @param {Object} request http request
 * @param {Object} response http response
 * @param {function} next description
 * @returns {void}
 */
function getDatasource (request, response, next) {
    Story.findOne({
        "$and": [
            {"_id": request.params.story_id},
            {"steps.datasources.key": request.params.datasource_hash},
            defaultQuery(request)
        ]})
        .orFail(createError(404, "Datasource not found")).exec()
        .then(() => getSignedUrl(request.params.datasource_hash))
        .then((url) => {
            response.status(302).redirect(formatUrl(url));
        }).catch((err) => {
            next(err);
        });
}

export {
    datasourceUpload,
    getDatasource
};
