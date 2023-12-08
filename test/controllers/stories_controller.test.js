import chai from "chai";
import chaiHttp from "chai-http";
import {faker} from "@faker-js/faker";

import app from "../../server.js";

import {storyFactory, authTokenFactory} from "../factory.js";


// Configure chai
chai.use(chaiHttp);
chai.should();

describe("Stories", () => {
    describe("GET /stories [index]", () => {
        it("should get all stories", (done) => {

            Promise.all([storyFactory.create(), storyFactory.create()]).then((stories) => {
                chai.request(app)
                    .get("/stories")
                    .end((err, res) => {
                        res.should.have.status(200);

                        res.body.should.be.an("array");
                        res.body.length.should.be.eql(2);

                        res.body[0].should.have.keys(
                            "_id title author description titleImage owner featured private sharedWith updatedAt"
                                .split(" "));

                        res.body.map((story) => story.title).should
                            .have.members(stories.map((story) => story.title));

                        (err === null).should.be.true;
                        done();
                    });
            });

        });
    });

    describe("GET /dipastoryselector [getStoriesForDipas]", () => {
        it("should get all stories in dipas wrapper", (done) => {

            Promise.all([storyFactory.create(), storyFactory.create()]).then((stories) => {
                chai.request(app)
                    .get("/dipastoryselector")
                    .end((err, res) => {
                        res.should.have.status(200);

                        res.body.should.be.an("object");
                        res.body.should.have.keys(["baseURL", "proceedingname", "proceedingurl", "stories"]);

                        res.body.stories.should.be.an("array");
                        res.body.stories.length.should.be.eql(2);

                        res.body.stories[0].should
                            .have.keys(["id", "title", "author", "description", "title_image", "category"]);

                        res.body.stories.map((story) => story.title).should
                            .have.members(stories.map((story) => story.title));

                        (err === null).should.be.true;
                        done();
                    });
            });

        });
    });

    describe("GET /s/:story_id/:step_index [redirectToStep]", () => {
        it("should redirect to frontend", (done) => {
            const story = Math.floor(Math.random() * 10),
                step = Math.floor(Math.random() * 10);

            chai.request(app)
                .get(`/s/${story}/${step}`)
                .redirects(0)
                .end((err, res) => {
                    res.should.have.status(301);
                    res.should.redirectTo(`${process.env.FRONTEND_URI}?story=${story}&step=${step}`);

                    (err === null).should.be.true;
                    done();
                });
        });
    });

    describe("GET /stories/:story_id [show]", () => {


        it("should get selected public story", (done) => {
            Promise.all([storyFactory.create(), storyFactory.create()]).then((stories) => {
                const story = stories[Math.floor(Math.random() * stories.length)];

                chai.request(app)
                    .get(`/stories/${story._id}`)
                    .end((err, res) => {
                        res.should.have.status(200);

                        res.body.should.be.an("object");
                        res.body.title.should.be.eql(story.title);

                        (err === null).should.be.true;
                        done();
                    });

            });
        });

        it("should return 404 for non-exist story", (done) => {
            chai.request(app)
                .get(`/stories/${faker.database.mongodbObjectId()}`)
                .end((err, res) => {
                    res.should.have.status(404);

                    (err === null).should.be.true;
                    done();
                });

        });

        it("should reject access to private story from anonymous", (done) => {
            const privateStory = storyFactory.create({private: true});

            Promise.all([storyFactory.create(), privateStory]).then((stories) => {
                const story = stories.find((s) => s.private);

                chai.request(app)
                    .get(`/stories/${story._id}`)
                    .end((err, res) => {
                        res.should.have.status(403);

                        (err === null).should.be.true;
                        done();
                    });

            });
        });

        it("should reject access to private story from random registered user", (done) => {
            const privateStory = storyFactory.create({private: true}),
                token = authTokenFactory.build();

            Promise.all([storyFactory.create(), privateStory]).then((stories) => {
                const story = stories.find((s) => s.private);

                chai.request(app)
                    .get(`/stories/${story._id}`)
                    .set("authorization", `Bearer ${token}`)
                    .end((err, res) => {
                        res.should.have.status(403);

                        (err === null).should.be.true;
                        done();
                    });

            });
        });

        it("should get selected private story to author", (done) => {
            const sub = faker.string.uuid(),
                token = authTokenFactory.params({sub: sub}).build(),

                privateStory = storyFactory.create({private: true, owner: sub});

            Promise.all([storyFactory.create(), privateStory]).then((stories) => {
                const story = stories.find((s) => s.private);

                chai.request(app)
                    .get(`/stories/${story._id}`)
                    .set("authorization", `Bearer ${token}`)
                    .end((err, res) => {
                        res.should.have.status(200);

                        res.body.should.be.an("object");
                        res.body.title.should.be.eql(story.title);

                        (err === null).should.be.true;
                        done();
                    });

            });
        });

        it("should get selected private story to with whom it shared", (done) => {
            const email = faker.internet.email().toLowerCase(),
                token = authTokenFactory.params({email: email}).build(),

                privateStory = storyFactory.create({private: true, sharedWith: [email]});

            Promise.all([storyFactory.create(), privateStory]).then((stories) => {
                const story = stories.find((s) => s.private);

                chai.request(app)
                    .get(`/stories/${story._id}`)
                    .set("authorization", `Bearer ${token}`)
                    .end((err, res) => {
                        res.should.have.status(200);

                        res.body.should.be.an("object");
                        res.body.title.should.be.eql(story.title);

                        (err === null).should.be.true;
                        done();
                    });

            });
        });

        it("should get selected private story to admin", (done) => {
            const token = authTokenFactory.params({role: "admin"}).build(),

                privateStory = storyFactory.create({private: true});

            Promise.all([storyFactory.create(), privateStory]).then((stories) => {
                const story = stories.find((s) => s.private);

                chai.request(app)
                    .get(`/stories/${story._id}`)
                    .set("authorization", `Bearer ${token}`)
                    .end((err, res) => {
                        res.should.have.status(200);

                        res.body.should.be.an("object");
                        res.body.title.should.be.eql(story.title);

                        (err === null).should.be.true;
                        done();
                    });

            });
        });
    });

    describe("POST /stories [create]", () => {
        it("should create new story", (done) => {
            const token = authTokenFactory.build(),
                newStory = storyFactory.build();

            chai.request(app)
                .post("/stories")
                .set("authorization", `Bearer ${token}`)
                .send(newStory)
                .end((err, res) => {
                    res.should.have.status(201);

                    res.body.should.be.an("object");
                    res.body.success.should.be.true;
                    res.body.should.have.keys(["success", "storyId"]);

                    (err === null).should.be.true;
                    done();
                });
        });
    });

    describe("PUT /stories/:story_id [update]", () => {
        it("should update story if author is authorized user", (done) => {
            const sub = faker.string.uuid(),
                token = authTokenFactory.params({sub: sub}).build(),
                newStory = storyFactory.build();

            storyFactory.create({owner: sub}).then((story) => {
                chai.request(app)
                    .patch(`/stories/${story._id}`)
                    .set("authorization", `Bearer ${token}`)
                    .send(newStory)
                    .end((err, res) => {
                        res.should.have.status(200);

                        res.body.should.be.an("object");
                        res.body.success.should.be.true;
                        res.body.should.have.keys(["success", "storyID"]);

                        (err === null).should.be.true;
                        done();
                    });
            });
        });

        it("should reject if author is not the same as authorized user", (done) => {
            const token = authTokenFactory.build(),
                newStory = storyFactory.build();

            storyFactory.create().then((story) => {
                chai.request(app)
                    .patch(`/stories/${story._id}`)
                    .set("authorization", `Bearer ${token}`)
                    .send(newStory)
                    .end((err, res) => {
                        res.should.have.status(403);

                        (err === null).should.be.true;
                        done();
                    });
            });
        });

        it("should update story if author is admin", (done) => {
            const token = authTokenFactory.params({role: "admin"}).build(),
                newStory = storyFactory.build();

            storyFactory.create().then((story) => {
                chai.request(app)
                    .patch(`/stories/${story._id}`)
                    .set("authorization", `Bearer ${token}`)
                    .send(newStory)
                    .end((err, res) => {
                        res.should.have.status(200);

                        res.body.should.be.an("object");
                        res.body.success.should.be.true;
                        res.body.should.have.keys(["success", "storyID"]);

                        (err === null).should.be.true;
                        done();
                    });
            });
        });
    });

    describe("PATCH /stories/:story_id/featured [featured]", () => {
        it("should update featured status of story if author is admin", (done) => {
            const token = authTokenFactory.params({role: "admin"}).build();

            storyFactory.create().then((story) => {
                chai.request(app)
                    .patch(`/stories/${story._id}/featured`)
                    .set("authorization", `Bearer ${token}`)
                    .end((err, res) => {
                        res.should.have.status(200);

                        res.body.should.be.an("object");
                        res.body.success.should.be.true;

                        (err === null).should.be.true;
                        done();
                    });
            });
        });

        it("should reject if author is not admin", (done) => {
            const token = authTokenFactory.build();

            storyFactory.create().then((story) => {
                chai.request(app)
                    .patch(`/stories/${story._id}/featured`)
                    .set("authorization", `Bearer ${token}`)
                    .end((err, res) => {
                        res.should.have.status(403);

                        (err === null).should.be.true;
                        done();
                    });
            });
        });
    });

    describe("DELETE /stories/:story_id [remove]", () => {
        it("should delete story if author is authorized user", (done) => {
            const sub = faker.string.uuid(),
                token = authTokenFactory.params({sub: sub}).build();

            storyFactory.create({owner: sub}).then((story) => {
                chai.request(app)
                    .delete(`/stories/${story._id}`)
                    .set("authorization", `Bearer ${token}`)
                    .end((err, res) => {
                        res.should.have.status(200);


                        (err === null).should.be.true;
                        done();
                    });
            });
        });

        it("should reject if author is not the same as authorized user", (done) => {
            const token = authTokenFactory.build();

            storyFactory.create().then((story) => {
                chai.request(app)
                    .delete(`/stories/${story._id}`)
                    .set("authorization", `Bearer ${token}`)
                    .end((err, res) => {
                        res.should.have.status(403);

                        (err === null).should.be.true;
                        done();
                    });
            });
        });

        it("should delete story if author is admin", (done) => {
            const token = authTokenFactory.params({role: "admin"}).build();

            storyFactory.create().then((story) => {
                chai.request(app)
                    .delete(`/stories/${story._id}`)
                    .set("authorization", `Bearer ${token}`)
                    .end((err, res) => {
                        res.should.have.status(200);

                        (err === null).should.be.true;
                        done();
                    });
            });
        });
    });

    describe("PATCH /stories/:story_id/privacy [privacy]", () => {
        it("should edit privacy if author is authorized user", (done) => {
            const sub = faker.string.uuid(),
                token = authTokenFactory.params({sub: sub}).build(),
                email = faker.internet.email().toLowerCase();

            storyFactory.create({owner: sub}).then((story) => {
                chai.request(app)
                    .patch(`/stories/${story._id}/privacy`)
                    .set("authorization", `Bearer ${token}`)
                    .send({private: true, sharedWith: [email]})
                    .end((err, res) => {
                        res.should.have.status(200);

                        (err === null).should.be.true;
                        done();
                    });
            });
        });

        it("should reject if author is not the same as authorized user", (done) => {
            const token = authTokenFactory.build(),
                email = faker.internet.email().toLowerCase();

            storyFactory.create().then((story) => {
                chai.request(app)
                    .patch(`/stories/${story._id}/privacy`)
                    .set("authorization", `Bearer ${token}`)
                    .send({private: true, sharedWith: [email]})
                    .end((err, res) => {
                        res.should.have.status(403);

                        (err === null).should.be.true;
                        done();
                    });
            });
        });

        it("should delete story if author is admin", (done) => {
            const token = authTokenFactory.params({role: "admin"}).build(),
                email = faker.internet.email().toLowerCase();

            storyFactory.create().then((story) => {
                chai.request(app)
                    .patch(`/stories/${story._id}/privacy`)
                    .set("authorization", `Bearer ${token}`)
                    .send({private: true, sharedWith: [email]})
                    .end((err, res) => {
                        res.should.have.status(200);

                        (err === null).should.be.true;
                        done();
                    });
            });
        });
    });

    describe("PATCH /stories/:story_id/:step_major/:step_minor/html [updateHtml]", () => {
        it("should update html if author is authorized user", (done) => {
            const sub = faker.string.uuid(),
                token = authTokenFactory.params({sub: sub}).build(),
                html = faker.lorem.paragraph();

            storyFactory.create({owner: sub}).then((story) => {
                chai.request(app)
                    .patch(`/stories/${story._id}/0/0/html`)
                    .set("authorization", `Bearer ${token}`)
                    .send({html: html})
                    .end((err, res) => {
                        res.should.have.status(200);

                        (err === null).should.be.true;
                        done();
                    });
            });
        });

        it("should reject if author is not the same as authorized user", (done) => {
            const token = authTokenFactory.build(),
                html = faker.lorem.paragraph();

            storyFactory.create().then((story) => {
                chai.request(app)
                    .patch(`/stories/${story._id}/0/0/html`)
                    .set("authorization", `Bearer ${token}`)
                    .send({html: html})
                    .end((err, res) => {
                        res.should.have.status(403);

                        (err === null).should.be.true;
                        done();
                    });
            });
        });

        it("should update html if author is admin", (done) => {
            const token = authTokenFactory.params({role: "admin"}).build(),
                html = faker.lorem.paragraph();

            storyFactory.create().then((story) => {
                chai.request(app)
                    .patch(`/stories/${story._id}/0/0/html`)
                    .set("authorization", `Bearer ${token}`)
                    .send({html: html})
                    .end((err, res) => {
                        res.should.have.status(200);

                        (err === null).should.be.true;
                        done();
                    });
            });
        });
    });
});
