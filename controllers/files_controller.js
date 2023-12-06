import multer from "multer";
import multerS3 from "multer-s3";

import {format as formatUrl} from "node:url";
import {v4 as uuidv4} from "uuid";
import {Folder} from "../models/folder.js";
import {s3client} from "../models/image.js";
import {Story} from "../models/story.js";
import createError from "http-errors";


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
async function addFilePath (request, response, next) {
    // create new folder on the database, all the files wil be stored in this folder
    console.log(request.files);

    try {
        const filePath = request.params.path ? request.params.path : "",
            newFilePath = `/${uuidv4()}${filePath ? "/" + filePath : ""}`,
            folders = request.files.reduce((acc, file) => {
                acc[file.fieldname] = acc[`${newFilePath}/${file.fieldname}`] || [];
                acc[file.fieldname].push({
                    location: file.location,
                    originalname: file.originalname,
                    key: file.key
                }); // Use file.location for S3 URL
                return acc;
            }, {}),
            newFolders = Object.entries(folders).map(([context, files]) => {
                return {context: context !== "files" ? `${newFilePath}/${context}` : newFilePath, files: [...files]};
            });


        Folder.insertMany(newFolders).then((f) => {
            return response.status(201).json({success: true, folder: newFilePath});
        }).catch((err) => {
            next(err);
        });
    }
    catch (error) {
        return response.status(500).send(error.message);
    }
}

/**
 * Returns all the structure of the story
 *
 * @param {Object} request http request
 * @param {Object} response http response
 * @param {function} next description
 * @returns {void}
 */
async function getDatasource (request, response, next) {
    try {
        const pathContext = request.params.path.split("/"),
            filename = pathContext.pop(),
            folderContext = pathContext.join("/"),

            // Assuming you have a model that stores folder information along with files
            // You might need to adjust the query depending on your schema
            folder = await Folder.findOne({context: `/${folderContext}`}),
            file = folder.files.find(f => filename === f.originalname);

        if (file) {
            // Assuming the 'files' field in your Folder model is an array of file references
            // You can then map these to their S3 URLs or any other required data
            // const fileData = folder.files.map(file => {
            //     return {
            //         name: file.name,
            //         s3Url: file.s3Url
            //     };
            // });

            response.redirect(302, formatUrl(file.location));
        }
        else {
            response.status(404).send("File not found");
        }

    }
    catch (error) {
        response.status(500).send(error.message);
    }
}


/**
 * Adds the file path to the story
 *
 * @param {Object} request http request
 * @param {Object} response http response
 * @param {function} next description
 * @returns {void}
 */
async function updateFiles (request, response, next) {
    console.log(request.body);
    try {
        const {threeDFilesUrl} = request.body,
            storyId = request.params.story_id, // assuming the story id is passed in the url

            // Update the threeDFiles field
            story = await Story.findOneAndUpdate(
                {"_id": storyId},
                {$set: {"threeDFilesId": threeDFilesUrl}},
                {new: true} // This option returns the modified document
            );

        if (!story) {
            return response.status(404).send("Story not found");
        }

        response.status(200).send(story);

    }
    catch (error) {
        return response.status(500).send(error.message);
    }
}

/**
 * This function will update the files and their paths in this step
 * @param {Object} request The request object
 * @param {Object} response The response object
 * @param {function}next the function to pass the data on to the next middleware
 * @returns {void}
 */
async function updateStepFiles (request, response, next) {
    Story.findById(request.params.story_id)
        .orFail(createError(404, "Story not found")).exec()
        .then((story) => {
            if (story.owner !== request.user?.sub && request.isAdmin === false) {
                throw createError(403, "Forbidden");
            }
            const html = story.prepareHtml(request.body.html);

            Story.findOneAndUpdate(
                {
                    "_id": story.id,
                    "steps": {
                        $elemMatch: {
                            "associatedChapter": parseInt(request.params.step_major, 10),
                            "stepNumber": parseInt(request.params.step_minor, 10)
                        }
                    }
                },
                {
                    "$set": {
                        "steps.$.html": html
                    }
                }
            ).then(() => {
                response.status(200).json({success: true});
            });
        }).catch((err) => {
            next(err);
        });
}

export {
    addFilePath, datasourceUpload, getDatasource, updateFiles, updateStepFiles
};

