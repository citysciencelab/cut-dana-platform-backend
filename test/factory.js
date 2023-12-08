import {Factory} from "fishery";
import {faker} from "@faker-js/faker";
import jwt from "jsonwebtoken";

import {Story} from "../models/story.js";


const storyFactory = Factory.define(({params, onCreate}) => {
        const fakedStory = {
                title: faker.lorem.sentence(5),
                description: faker.lorem.paragraph(),
                author: faker.person.fullName(),
                owner: faker.string.uuid(),
                titleImage: faker.image.urlPicsumPhotos(),
                chapters: [],
                sharedWith: []
            },
            story = {...fakedStory, ...params};


        onCreate(storyAttributes => Story.create(storyAttributes));

        return story;
    }),

    stepFactory = Factory.define(({params}) => {
        const fakedStep = {
                title: faker.lorem.sentence(5),
                html: faker.lorem.paragraph(),
                stepNumber: Math.floor(Math.random() * 10),
                associatedChapter: Math.floor(Math.random() * 10)
            },
            step = {...fakedStep, ...params};

        return step;
    }),

    datasourceFactory = Factory.define(({params}) => {
        const fakedDatasource = {
                name: faker.lorem.sentence(5),
                key: faker.string.uuid()
            },
            datasource = {...fakedDatasource, ...params};

        return datasource;
    }),

    authTokenFactory = Factory.define(({params}) => {
        const payload = {
                sub: params.sub || faker.string.uuid(),
                name: params.name || faker.person.fullName(),
                email: params.email || faker.internet.email(),
                realm_access: {
                    roles: [params.role || "user"]
                }
            },
            secret = "12345678",
            options = {expiresIn: "1h"};

        return jwt.sign(payload, secret, options);
    });

export {storyFactory, authTokenFactory, stepFactory, datasourceFactory};
