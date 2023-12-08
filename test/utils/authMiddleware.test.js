import {expect} from "chai";
import {authMiddleware} from "../../utils/authMiddleware.js";
import {authTokenFactory} from "../factory.js";

describe("authMiddleware", () => {
    it("should set request.user to null if no authorization header is present", () => {
        const request = {headers: {}},
            response = {},
            next = () => {};

        authMiddleware(request, response, next);

        expect(request.user).to.be.null;
    });

    it("should set request.user to the decoded payload if a valid authorization header is present", () => {
        const payload = {sub: "1234567890", name: "John Doe"},
            token = authTokenFactory.params(payload).build(),
            request = {headers: {authorization: `Bearer ${token}`}},
            response = {},
            next = () => {};

        authMiddleware(request, response, next);

        expect(request.user).to.be.an("object");
        expect(request.user.sub).to.equal(payload.sub);
        expect(request.user.name).to.equal(payload.name);
    });

    it("should set request.isAdmin to true if the user has the admin role", () => {
        const token = authTokenFactory.params({role: "admin"}).build(),
            request = {headers: {authorization: `Bearer ${token}`}},
            response = {},
            next = () => {};

        authMiddleware(request, response, next);

        expect(request.isAdmin).to.be.true;
    });

    it("should set request.isAdmin to false if the user hasn't the admin role", () => {
        const token = authTokenFactory.params({role: "user"}).build(),
            request = {headers: {authorization: `Bearer ${token}`}},
            response = {},
            next = () => {};

        authMiddleware(request, response, next);

        expect(request.isAdmin).to.be.false;
    });
});
