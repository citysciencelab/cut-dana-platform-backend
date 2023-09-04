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
function getSteps (request, response, next) {
    prisma.steps.findMany().then((steps) => {
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
function getStoryStep (request, response, next) {
    prisma.steps.findFirstOrThrow({
        where: {
            story_id: parseInt(request.params.story_id, 10),
            step_major: parseInt(request.params.step_major, 10),
            step_minor: parseInt(request.params.step_minor, 10)
        }
    }).then((step) => {
        response.json(step);
    }).catch((err) => {
        next(err);
    });
}

/**
 * Retrieve all story steps for a given story
 * @param {Object} request description
 * @param {Number} response description
 * @param {function} next description
 * @returns {void}
 */
function getStepsByStoryId (request, response, next) {
    prisma.steps.findMany({
        where: {
            story_id: parseInt(request.params.story_id, 10)
        }
    }).then((steps) => {
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
    prisma.steps.findFirstOrThrow({
        where: {
            story_id: parseInt(request.params.story_id, 10),
            step_major: parseInt(request.params.step_major, 10),
            step_minor: parseInt(request.params.step_minor, 10)
        },
        select: {
            html: true
        }
    }).then((step) => {
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
function createStep (request, response, next) {
    prisma.steps.create({
        data: {
            story_id: parseInt(request.params.story_id, 10),
            step_major: parseInt(request.params.step_major, 10),
            step_minor: parseInt(request.params.step_minor, 10),
            html: request.body.html
        }
    }).then(() => {
        response.status(201).send("step added");
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
function addHtml (request, response, next) {
    prisma.steps.updateMany({
        where: {
            story_id: parseInt(request.params.story_id, 10),
            step_major: parseInt(request.params.step_major, 10),
            step_minor: parseInt(request.params.step_minor, 10)
        },
        data: {
            html: request.body.html
        }
    }).then(() => {
        response.send("added html");
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
function deleteAllStorySteps (request, response, next) {
    prisma.steps.deleteMany({
        where: {
            story_id: parseInt(request.params.story_id, 10)
        }
    }).then(() => {
        response.send("all steps of story deleted");
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
function deleteStepMajor (request, response, next) {
    prisma.steps.deleteMany({
        where: {
            story_id: parseInt(request.params.story_id, 10),
            step_major: parseInt(request.params.step_major, 10)
        }
    }).then(() => {
        response.send("major step deleted");
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
function deleteStepMinor (request, response, next) {
    prisma.steps.deleteMany({
        where: {
            story_id: parseInt(request.params.story_id, 10),
            step_major: parseInt(request.params.step_major, 10),
            step_minor: parseInt(request.params.step_minor, 10)
        }
    }).then(() => {
        response.send("minor step deleted");
    }).catch((err) => {
        next(err);
    });
}

export {getSteps, getStoryStep, getStepsByStoryId, getHtml, createStep, addHtml, deleteAllStorySteps, deleteStepMajor,
    deleteStepMinor};
