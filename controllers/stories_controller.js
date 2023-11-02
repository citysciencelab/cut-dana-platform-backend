import createError from "http-errors";
import {stripHtml} from "string-strip-html";

import {deleteImagesFromS3} from "../models/image.js";
import {Story} from "../models/story.js";
import {orderBuilder} from "../utils/orderBuilder.js";
import {queryBuilder} from "../utils/queryBuilder.js";


/**
 * Redirect to frontend
 *
 * @param {Object} request http request
 * @param {Object} response http response
 * @returns {void}
 */
function redirectToStep (request, response) {
    // eslint-disable-next-line no-process-env
    response.redirect(301, `${process.env.FRONTEND_URI}?story=${request.params.story_id}&step=${request.params.step_index}`);
}


/**
 * Create story
 *
 * @param {Object} request http request
 * @param {Object} response http response
 * @param {function} next description
 * @returns {void}
 */
function create (request, response, next) {
    // Strict schema prevents from saving unvanted data
    const newStory = request.body;

    newStory.author = request.user?.preferred_username || request.user?.name || "anonymous";
    newStory.owner = request.user?.sub || "anonymous";
    Story.create(newStory).then((story) => {
        response.status(201).json({success: true, storyId: story._id});
    }).catch((err) => {
        next(err);
    });
}


/**
 * Update story
 *
 * @param {Object} request http request
 * @param {Object} response http response
 * @param {function} next description
 * @returns {void}
 */
function update (request, response, next) {
    const newStory = request.body;

    Story.findById(request.params.story_id)
        .orFail(createError(404, "Story not found")).exec()
        .then((story) => {
            if (story.owner !== request.user?.sub && request.isAdmin === false) {
                throw createError(403, "Forbidden");
            }
            // update story
            return story.set({
                titleImage: story.checkTitleImage(newStory.titleImage)[0],
                title: newStory.title,
                description: newStory.description,
                storyInterval: newStory.storyInterval,
                chapters: newStory.chapters,
                displayType: newStory.displayType,
                steps: newStory.steps,
                private: newStory.private,
                sharedWith: newStory.sharedWith
            }).save();
        }).then(() => {
            response.status(200).json({success: true, storyID: request.params.story_id});
        }).catch((err) => {
            next(err);
        });
}

/**
 * Toggle featured status of story
 * @param {Object} request http request
 * @param {Object} response http response
 * @param {function} next description
 * @returns {void}
 */
function featured (request, response, next) {
    if (request.isAdmin === false) {
        throw createError(403, "Forbidden");
    }
    Story.findById(request.params.story_id)
        .orFail(createError(404, "Story not found")).exec()
        .then((story) => {
            story.featured = !story.featured;
            Story.findOneAndUpdate(
                {"_id": story.id},
                {"$set": {featured: story.featured}}
            ).then(() => {
                response.status(200).json({success: true});
            });
        }).catch((err) => {
            next(err);
        });
}


/**
 * Update story privacy settings
 * @param {Object} request http request
 * @param {Object} response http response
 * @param {function} next description
 * @returns {void}
 */
function privacy (request, response, next) {
    Story.findById(request.params.story_id)
        .orFail(createError(404, "Story not found")).exec()
        .then((story) => {
            if (story.owner !== request.user?.sub && request.isAdmin === false) {
                throw createError(403, "Forbidden");
            }
            Story.findOneAndUpdate(
                {"_id": story.id},
                {"$set":
                    {
                        private: request.body.private === true,
                        sharedWith: request.body.sharedWith.map((e) => stripHtml(e).result.trim().toLowerCase())
                    }
                }
            ).then(() => {
                response.status(200).json({success: true});
            });
        }).catch((err) => {
            next(err);
        });
}

/**
 * Update step HTML with prepared image
 * @param {Object} request http request
 * @param {Object} response http response
 * @param {function} next description
 * @returns {void}
 */
function updateHtml (request, response, next) {
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


// GET

/**
 * Returns all stories with short information
 *
 * @param {Object} request http request
 * @param {Object} response http response
 * @param {function} next description
 * @returns {void}
 */
function index (request, response, next) {
    Story.find(
        queryBuilder(request),
        "_id title author description titleImage owner featured private sharedWith updatedAt"
    ).sort(orderBuilder(request))
        .exec()
        .then((stories) => {
            // Disable caching
            response.header("Cache-Control", "no-cache, no-store, must-revalidate");
            response.header("Pragma", "no-cache");
            response.header("Expires", 0);
            response.json(stories);
        }).catch((err) => {
            next(err);
        });
}

/**
 * Returns all stories with further information necessary for the dipas story selector
 *
 * @param {Object} request http request
 * @param {Object} response http response
 * @param {function} next description
 * @returns {void}
 */
function getStoriesForDipas (request, response, next) {
    Story.find(queryBuilder(request), "_id title author description titleImage")
        .sort(orderBuilder(request))
        .exec()
        .then((stories) => {
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
 * Returns all the structure of the story
 *
 * @param {Object} request http request
 * @param {Object} response http response
 * @param {function} next description
 * @returns {void}
 */
function show (request, response, next) {
    Story.findById(request.params.story_id)
        .orFail(createError(404, "Story not found"))
        .then((story) => {
            if (story.private && (!request.user ||
                    (request.isAdmin === false &&
                     story.owner !== request.user?.sub &&
                     !story.sharedWith.includes(request.user?.email)
                    )
            )) {
                throw createError(403, "Forbidden");
            }

            Story.findOneAndUpdate({"_id": story.id}, {$inc: {"views": 1}}).then(() => {
                response.json(story);
            });
        }).catch((err) => {
            next(err);
        });
}


/**
 * Removes story from database and all images from S3
 *
 * @param {Object} request http request
 * @param {Object} response http response
 * @param {function} next description
 * @returns {void}
 */
function remove (request, response, next) {
    Story.findById(request.params.story_id)
        .orFail(createError(404, "Story not found")).exec()
        .then((story) => {
            if (story.owner !== request.user?.sub && request.isAdmin === false) {
                throw createError(403, "Forbidden");
            }
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
    create, featured, getStoriesForDipas, index, privacy, redirectToStep, remove, show, update, updateHtml
};
