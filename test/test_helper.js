import mongoose from "mongoose";

// tell mongoose to use es6 implementation of promises
mongoose.Promise = global.Promise;
// eslint-disable-next-line no-process-env
mongoose.connect(process.env.MONGODB_TEST_URI);

mongoose.connection
    .once("open", () => console.log("Connected!"))
    .on("error", (error) => {
        console.warn("Error : ", error);
    });

// cleanUp after each test
afterEach((done) => {
    mongoose.connection.collections.stories.drop(() => {
        done();
    });
});
