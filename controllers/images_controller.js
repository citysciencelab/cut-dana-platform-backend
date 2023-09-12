import mime from "mime-types";
import {S3Client} from "@aws-sdk/client-s3";
import multer from "multer";
import multerS3 from "multer-s3";
import {PrismaClient} from "@prisma/client";

/* eslint-disable no-process-env */

const prisma = new PrismaClient(),
    s3client = new S3Client({
        secretAccessKey: process.env.AWS_ACCESS_KEY_ID,
        accessKeyId: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION
    });

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
    prisma.images.findFirstOrThrow({
        where: {
            hash: request.params.image_hash
        }, select: {
            location: true
        }
    }).then((image) => {
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

    prisma.images.create({
        data: {
            filetype: request.file.mimetype,
            story_id: parseInt(request.params.story_id, 10),
            step_major: parseInt(request.params.step_major, 10),
            step_minor: parseInt(request.params.step_minor, 10),
            hash: request.params.image_hash,
            location: filepath,
            key: request.file.key
        }
    }).then(() => {
        response.status(201).json({sucess: true, filepath});
    }).catch((err) => {
        next(err);
    });
}

export {imageUpload, getImageById, addImagePath};
