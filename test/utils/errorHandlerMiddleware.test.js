import {expect} from "chai";
import {errorHandlerMiddleware} from "../../utils/errorHandlerMiddleware.js";

describe("errorHandlerMiddleware", () => {
    it("should return an error response with the given status code and message", () => {
        const error = {
                status: 404,
                message: "Not found"
            },
            request = {},
            response = {
                status: function (statusCode) {
                    expect(statusCode).to.equal(error.status);
                    return this;
                },
                json: function (data) {
                    expect(data.error).to.equal(error.message);
                }
            },
            next = () => {};

        errorHandlerMiddleware(error, request, response, next);
    });
});
