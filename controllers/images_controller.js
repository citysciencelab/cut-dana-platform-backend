import mime from "mime-types";
import path from "path";
import multer from "multer";


import {PrismaClient} from "@prisma/client";

/* eslint-disable no-process-env */
const prisma = new PrismaClient(),
    imagePath = process.env.IMAGE_PATH,

    /**
 * storing image files on disk
 *
 * @param {Object} request description
 * @param {Number} response description
 * @param {function} next description
 * @returns {void}
 */
    // AFTER : Create multer object
    imageUpload = multer({
        storage: multer.diskStorage(
            {
                destination: (req, file, cb) => {
                    cb(null, imagePath);
                },
                filename: (req, file, cb) => {
                    cb(
                        null,
                        req.params.image_hash + "." + mime.extension(file.mimetype)
                    );
                }
            }
        )
    });

/* eslint-enable */


/**
 * description
 *
 * @param {Object} request description
 * @param {Number} response description
 * @param {function} next description
 * @returns {void}
 */
function getImage (request, response, next) {
    prisma.images.findFirstOrThrow({
        where: {
            story_id: parseInt(request.params.story_id, 10),
            step_major: parseInt(request.params.step_major, 10),
            step_minor: parseInt(request.params.step_minor, 10)
        }
    }).then((image) => {
        const image_path = imagePath + image.hash + "." + mime.extension(image.filetype);

        response.sendFile(image_path, {root: path.join(__dirname, "/../")});
    }).catch((err) => {
        next(err);
    });
}


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
        }
    }).then((image) => {
        const image_path = imagePath + image.hash + "." + mime.extension(image.filetype);

        response.sendFile(image_path, {root: path.join(__dirname, "/../")});
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
    const filepath = request.file.path;

    prisma.images.create({
        data: {
            filetype: request.file.mimetype,
            story_id: parseInt(request.params.story_id, 10),
            step_major: parseInt(request.params.step_major, 10),
            step_minor: parseInt(request.params.step_minor, 10),
            hash: request.params.hash
        }
    }).then(() => {
        response.status(201).json({sucess: true, filepath});
    }).catch((err) => {
        next(err);
    });
}

export {imageUpload, getImage, getImageById, addImagePath};
