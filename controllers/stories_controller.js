import createError from "http-errors";
import {Story} from "../models/story.js";
import {Image, deleteImagesFromS3} from "../models/image.js";


/**
 * description
 *
 * @param {Object} request description
 * @param {Number} response description
 * @param {function} next description
 * @returns {void}
 */
function create (request, response, next) {
    // Strict schema prevents from saving unvanted data
    Story.create(request.body).then((newStory) => {
        response.status(201).json({success: true, storyID: newStory._id});
    }).catch((err) => {
        next(err);
    });
}


// GET

/**
 * description
 *
 * @param {Object} request description
 * @param {Number} response description
 * @param {function} next description
 * @returns {void}
 */
function getStories (request, response, next) {
    Story.find({ }, "_id title author description titleImage").exec().then((stories) => {
        response.json(stories);
    }).catch((err) => {
        next(err);
    });
}

/**
 * Returns all stories with further information necessary for the dipas story selector
 *
 * @param {Object} request description
 * @param {Number} response description
 * @param {function} next description
 * @returns {void}
 */
function getStoriesForDipas (request, response, next) {
    Story.find({ }, "_id title author description titleImage").exec().then((stories) => {
        const result = {
            baseURL: "data.storybaseurl",
            proceedingname: "data.proceedingname",
            proceedingurl: "data.proceedingurl",
            stories: stories.map((story) => {
                return {
                    id: story._id,
                    title: story.title,
                    author: story.author,
                    category: story.author,
                    description: story.description,
                    title_image: story.title_image
                };
            })
        };

        response.json(result);
    }).catch((err) => {
        next(err);
    });
}

/**
 * Returns all th structure of all stories
 *
 * @param {Object} request description
 * @param {Number} response description
 * @param {function} next description
 * @returns {void}
 */
function getStoryStructure (request, response, next) {
    Story.findById(request.params.story_id)
        .orFail(createError(404, "Story not found")).exec()
        .then((story) => {
            response.json(story);
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
function getStoriesAllData (request, response, next) {
    Story.find({ }).exec().then((stories) => {
        response.json(stories);
    }).catch((err) => {
        next(err);
    });
}

/**
 * Removes story from database and all images from S3
 * TODO: keep all images in the same document (Story)
 *
 * @param {Object} request description
 * @param {Number} response description
 * @param {function} next description
 * @returns {void}
 */
function deleteStory (request, response, next) {
    Story.deleteOne({_id: request.params.story_id}).then(() => {
        Image.find({story_id: request.params.story_id}).then((images) => {
            if (images.length === 0) {
                response.status(201).send("story deleted");
            }
            else {
                deleteImagesFromS3(images).then(() => {
                    Image.deleteMany({story_id: request.params.story_id}).then(() => {
                        response.status(201).send("story deleted");
                    });
                });
            }
        });
    }).catch((err) => {
        next(err);
    });
}

export {getStories, getStoryStructure, create, deleteStory, getStoriesAllData, getStoriesForDipas};
