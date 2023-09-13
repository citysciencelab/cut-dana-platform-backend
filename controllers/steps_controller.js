import createError from "http-errors";
import {Story} from "../models/story.js";


// /**
//  * description
//  *
//  * @param {Object} request description
//  * @param {Number} response description
//  * @param {function} next description
//  * @returns {void}
//  */
// function getStoryStep (request, response, next) {
//     prisma.steps.findFirstOrThrow({
//         where: {
//             story_id: parseInt(request.params.story_id, 10),
//             step_major: parseInt(request.params.step_major, 10),
//             step_minor: parseInt(request.params.step_minor, 10)
//         }
//     }).then((step) => {
//         response.json(step);
//     }).catch((err) => {
//         next(err);
//     });
// }

/**
 * Retrieve all story steps for a given story
 * @param {Object} request description
 * @param {Number} response description
 * @param {function} next description
 * @returns {void}
 */
function getStepsByStoryId (request, response, next) {
    Story.findById(request.params.story_id, "steps")
        .orFail(createError(404, "Story not found")).exec()
        .then((steps) => {
            response.json(steps);
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
function getHtml (request, response, next) {
    Story.findById(request.params.story_id, "steps")
        .orFail(createError(404, "Story not found")).exec()
        .then((story) => {
            const step = story.steps.find((candidate) => {
                return candidate.associatedChapter === parseInt(request.params.step_major, 10) &&
                       candidate.stepNumber === parseInt(request.params.step_minor, 10);
            });

            if (!step) {
                throw createError(404, "Step not found");
            }

            response.json(step.html);
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
function addHtml (request, response, next) {
    Story.findOneAndUpdate({
        "_id": request.params.story_id,
        "steps.associatedChapter": parseInt(request.params.step_major, 10),
        "steps.stepNumber": parseInt(request.params.step_minor, 10)
    }, {"steps.$.html": request.body.html}).orFail(createError(404, "Story not found")).then(() => {
        response.send("added html");
    }).catch((err) => {
        next(err);
    });
}


// DELETE

// /**
//  * description
//  *
//  * @param {Object} request description
//  * @param {Number} response description
//  * @param {function} next description
//  * @returns {void}
//  */
// function deleteAllStorySteps (request, response, next) {
//     prisma.steps.deleteMany({
//         where: {
//             story_id: parseInt(request.params.story_id, 10)
//         }
//     }).then(() => {
//         response.send("all steps of story deleted");
//     }).catch((err) => {
//         next(err);
//     });
// }

// /**
//  * description
//  *
//  * @param {Object} request description
//  * @param {Number} response description
//  * @param {function} next description
//  * @returns {void}
//  */
// function deleteStepMajor (request, response, next) {
//     prisma.steps.deleteMany({
//         where: {
//             story_id: parseInt(request.params.story_id, 10),
//             step_major: parseInt(request.params.step_major, 10)
//         }
//     }).then(() => {
//         response.send("major step deleted");
//     }).catch((err) => {
//         next(err);
//     });
// }

// /**
//  * description
//  *
//  * @param {Object} request description
//  * @param {Number} response description
//  * @param {function} next description
//  * @returns {void}
//  */
// function deleteStepMinor (request, response, next) {
//     prisma.steps.deleteMany({
//         where: {
//             story_id: parseInt(request.params.story_id, 10),
//             step_major: parseInt(request.params.step_major, 10),
//             step_minor: parseInt(request.params.step_minor, 10)
//         }
//     }).then(() => {
//         response.send("minor step deleted");
//     }).catch((err) => {
//         next(err);
//     });
// }

export {getStepsByStoryId, getHtml, addHtml};
