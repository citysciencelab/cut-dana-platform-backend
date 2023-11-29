import multer from "multer";
import multerS3 from "multer-s3";

import { v4 as uuidv4 } from "uuid";
import { Folder } from "../models/folder.js";
import { s3client } from "../models/image.js";


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
            const fileExtension = file.originalname.split(".").pop();

            cb(null, `${new Date().valueOf()}_${uuidv4()}.${fileExtension}`);
        }
    })
});

/**
 *
 * @param {Object} request http request
 * @param {Object} response http response
 * @param {void} next next function
 * @returns {void}
 */
function addFilePath (request, response, next) {
    // create new folder on the database, all the files wil be stored in this folder
    const filePath = request.params[0],
        newFilePath = `/${uuidv4()}/${filePath}`,

        filename = filePath.split("/").pop(),
        newFolder = {
            context: newFilePath,
            files: request.files
        };

    Folder.create(newFolder).then((folder) => {
        response.status(201).json({success: true, folder: folder.context});
    }).catch((err) => {
        next(err);
    });
    // prepend random uuid to the filePAth
    // store the filepath in the database

}

/**
 * Returns all the structure of the story
 *
 * @param {Object} request http request
 * @param {Object} response http response
 * @param {function} next description
 * @returns {void}
 */
function getDatasource (request, response, next) {
    const filePath = request.params[0];

    console.log(filePath);
    // check the databse here. The filename should be requested from the mongodb and the stored url should be redirected.
    // console.log(request.params.datasource_hash);
    response.status(200).json({success: true, filePath});
}

export {
    addFilePath, datasourceUpload, getDatasource
};

