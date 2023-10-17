/**
* Build MongoDB order By from request query
*
* @param {Object} request HTTP request
* @returns {Object} MongoDB query
*/
export function orderBuilder (request) {
    if (request.query.mode === "popular") {
        return {views: -1};
    }
    return {createdAt: -1};
}
