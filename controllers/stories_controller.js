import {PrismaClient} from "@prisma/client";
const prisma = new PrismaClient();


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
    prisma.stories.findMany({
        select: {
            id: true,
            title: true,
            author: true,
            description: true,
            category: true,
            title_image: true
        }
    }).then((stories) => {
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
    prisma.stories.findMany({
        select: {
            id: true,
            title: true,
            author: true,
            description: true,
            category: true
        }
    }).then((stories) => {
        const result = {
            baseURL: "data.storybaseurl",
            proceedingname: "data.proceedingname",
            proceedingurl: "data.proceedingurl",
            stories: stories
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
    prisma.stories.findUniqueOrThrow({
        where: {
            id: parseInt(request.params.story_id, 10)
        },
        select: {
            story_json: true
        }
    }).then((story) => {
        response.json(story.story_json);
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
    prisma.stories.findMany().then((stories) => {
        response.json(stories);
    }).catch((err) => {
        next(err);
    });
}

// POST/PUT

/**
 * description
 *
 * @param {Object} request description
 * @param {Number} response description
 * @param {function} next description
 * @returns {void}
 */
function createStory (request, response, next) {
    prisma.stories.create({
        data: {
            title: request.body.story_json.title,
            story_interval: parseInt(request.body.story_interval, 10),
            category: null,
            story_json: request.body.story_json,
            author: request.body.author,
            description: request.body.description,
            title_image: request.body.title_image,
            display_type: request.body.display_type
        }
    }).then((newStory) => {
        response.status(201).json({success: true, storyID: newStory.id});
    }).catch((err) => {
        next(err);
    });
}


// DELETE

/**
 * description
 *
 * @param {Object} request description
 * @param {Number} response description
 * @param {function} next description
 * @returns {void}
 */
function deleteStory (request, response, next) {
    const deleteSteps = prisma.steps.deleteMany({
            where: {
                story_id: parseInt(request.params.story_id, 10)
            }
        }),
        deleteSelf = prisma.stories.delete({
            where: {
                id: parseInt(request.params.story_id, 10)
            }
        });

    prisma.$transaction([deleteSteps, deleteSelf]).then(() => {
        response.status(201).send("story deleted");
    }).catch((err) => {
        next(err);
    });
    // TODO: delete all images associated with story
}

export {getStories, getStoryStructure, createStory, deleteStory, getStoriesAllData, getStoriesForDipas};
