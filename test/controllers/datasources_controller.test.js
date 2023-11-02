import chai from "chai";
import chaiHttp from "chai-http";
import {faker} from "@faker-js/faker";
import sinon from "sinon";

import {parseUrl} from "@aws-sdk/url-parser";
import {S3RequestPresigner} from "@aws-sdk/s3-request-presigner";

import {getDatasource} from "../../controllers/datasources_controller.js";
import httpMocks from "node-mocks-http";

import app from "../../server.js";

import {storyFactory, stepFactory, datasourceFactory} from "../factory.js";


// Configure chai
chai.use(chaiHttp);
chai.should();

describe("Datasources", () => {
    describe("GET /datasources/:story_id/:datasource_hash [getDatasource]", () => {
        it("should return 404 for non-exist story", (done) => {
            chai.request(app)
                .get(`/datasources/${faker.database.mongodbObjectId()}/${faker.string.uuid()}`)
                .end((err, res) => {
                    res.should.have.status(404);

                    (err === null).should.be.true;
                    done();
                });

        });

        it("should redirect to datasource in story", () => {
            const datasource = datasourceFactory.build(),
                step = stepFactory.params({datasources: [datasource]}).build(),
                owner = faker.string.uuid(),
                preparedStory = storyFactory.create({steps: [step], owner: owner, private: false}),

                presignedUrl = "https://example.com/presignedUrl",
                parsedUrl = parseUrl(presignedUrl),
                presignerStub = sinon.stub(S3RequestPresigner.prototype, "presign"),
                next = sinon.spy(),
                res = httpMocks.createResponse();

            presignerStub.returns(parsedUrl);

            return Promise.resolve(preparedStory).then((story) => httpMocks.createRequest({
                params: {
                    story_id: story.id,
                    datasource_hash: datasource.key
                }
            })
            ).then((req) => Promise.resolve(getDatasource(req, res, next))).then(() => {
                next.called.should.be.false;
                res.statusCode.should.be.eql(302);
                res._getRedirectUrl().should.be.equal(presignedUrl);
            }).finally(() => {
                presignerStub.restore();
            });
        });
    });
});
