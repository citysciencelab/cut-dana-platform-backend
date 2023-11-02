/**
 * Handles errors
 *
 * @param {Object} error description
 * @param {Object} request description
 * @param {Object} response description
 * @param {function} next description
 * @returns {void}
 */
export function errorHandlerMiddleware (error, request, response, next) {
    const details = {error: error.message};

    switch (error.status) {
        case 404:
        case 400:
            response.status(error.status).json(details);
            break;
        default:
            if (request.app.get("env") === "development") {
                details.stack = error.stack;
            }
            response.status(error.status || 500).json(details);
    }
    // next(error);
}
