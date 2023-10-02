import createError from "http-errors";

import {Story} from "../models/story.js";
import {deleteImagesFromS3} from "../models/image.js";


/**
 * description
 *
 * @param {Object} request description
 * @param {Number} response description
 * @param {function} next description
 * @returns {void}
 */
function redirectToStep (request, response) {
    // eslint-disable-next-line no-process-env
    response.status(301).redirect(`${process.env.FRONTEND_URI}?story=${request.params.story_id}&step=${request.params.step_index}`);
}


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
        response.status(201).json({success: true, storyId: newStory._id});
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
function update (request, response, next) {
    const newStory = request.body;

    Story.findById(request.params.story_id)
        .orFail(createError(404, "Story not found")).exec()
        .then((story) => {
            // update story
            return story.set({
                titleImage: story.checkTitleImage(newStory.titleImage)[0],
                title: newStory.title,
                author: newStory.author,
                description: newStory.description,
                storyInterval: newStory.storyInterval,
                chapters: newStory.chapters,
                displayType: newStory.displayType,
                steps: newStory.steps
            }).save();
        }).then(() => {
            response.status(200).json({success: true, storyID: request.params.story_id});
        }).catch((err) => {
            next(err);
        });
}

/**
 * Update step HTML with prepared image
 * @param {Object} request description
 * @param {Object} response description
 * @param {function} next description
 * @returns {void}
 */
function updateHtml (request, response, next) {
    Story.findById(request.params.story_id)
        .orFail(createError(404, "Story not found")).exec()
        .then((story) => {
            const html = story.prepareHtml(request.body.html);

            Story.findOneAndUpdate(
                {
                    "_id": story.id,
                    "steps.associatedChapter": parseInt(request.params.step_major, 10),
                    "steps.stepNumber": parseInt(request.params.step_minor, 10)
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


// GET

/**
 * description
 *
 * @param {Object} request description
 * @param {Number} response description
 * @param {function} next description
 * @returns {void}
 */
function index (request, response, next) {
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
                    title_image: story.titleImage
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
function show (request, response, next) {
    Story.findById(request.params.story_id)
        .orFail(createError(404, "Story not found")).exec()
        .then((story) => {
            response.json(story);
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
function remove (request, response, next) {
    Story.findById(request.params.story_id)
        .orFail(createError(404, "Story not found")).exec()
        .then((story) => {
            if (story.images.length > 0) {
                deleteImagesFromS3(story.images);
            }
            return Story.deleteOne({_id: request.params.story_id});
        }).then(() => {
            response.status(200).send("story deleted");
        }).catch((err) => {
            next(err);
        });
}


export {
    index,
    show,
    create,
    update,
    remove,
    getStoriesForDipas,
    redirectToStep,
    updateHtml
};
