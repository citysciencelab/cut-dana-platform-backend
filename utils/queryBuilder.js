/**
 *
 * Default query for MongoDB
 *
 * @param {Object} request HTTP request
 * @returns {Object} MongoDB query
 */
function defaultQuery (request) {
    return {
        $or: [
            {private: false},
            {owner: request.user?.sub},
            {sharedWith: request.user?.email}
        ]
    };
}

/**
 * Build MongoDB select query from request query
 *
 * @param {Object} request HTTP request
 * @returns {Object} MongoDB query
 */
export function queryBuilder (request) {
    if (request.query.mode === "my") {
        return {owner: request.user?.sub};
    }
    return defaultQuery(request);
}