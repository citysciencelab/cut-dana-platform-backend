import {expect} from "chai";
import {defaultQuery} from "../../utils/queryBuilder.js";

describe("queryBuilder", () => {
    describe("defaultQuery", () => {
        it("should return an empty query object if the user is an admin", () => {
            const request = {isAdmin: true},
                query = defaultQuery(request);

            expect(query).to.deep.equal({});
        });

        it("should return a query object that matches public documents and documents owned by the user or shared with the user", () => {
            const request = {
                    user: {sub: "1234567890", email: "test@example.com"}
                },
                query = defaultQuery(request);

            expect(query).to.deep.equal({
                $or: [
                    {private: false},
                    {owner: request.user?.sub},
                    {sharedWith: request.user?.email}
                ]
            });
        });
    });
});
