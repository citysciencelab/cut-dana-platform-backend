/**
 * Extract user info from token (if present)
 *
 * @param {Object} request description
 * @param {Object} response description
 * @param {function} next description
 * @returns {void}
 */
export function authMiddleware (request, response, next) {
    if (request.headers.authorization) {
        const token = request.headers.authorization?.split(" ")[1];

        if (!token) {
            request.user = null;
        }
        else {

            const base64Url = token.split(".")[1],
                base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/"),
                jsonPayload = decodeURIComponent(atob(base64).split("").map(function (c) {
                    return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
                }).join("")),
                payload = JSON.parse(jsonPayload);

            // console.log("payload", payload); // .resource_access.account.roles);
            if (payload.realm_access.roles.includes("admin")) {
                request.isAdmin = true;
            }

            request.user = payload;
        }
    }
    next();
}
