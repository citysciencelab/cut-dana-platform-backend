import {Router, type Request, type Response} from "express";
import {PrismaClient, type Story} from "@prisma/client";
import type {CreateStoryBody} from "./Story/CreateStory/createStoryBody.ts";
import authMiddleware from "../middlewares/authMiddleware.ts";

const prismaClient = new PrismaClient();

const storyRouter = Router()

storyRouter.get("/", async (req: Request, res: Response) => {
    const stories = await prismaClient.story.findMany();
    res.status(200).send(stories)
})

storyRouter.get("/:id", async (req: Request, res: Response) => {
    const story = await prismaClient.story.findUniqueOrThrow({
        where: {
            id: parseInt(req.params.id)
        }
    })
    res.status(200).send(story)
})

storyRouter.post("/", authMiddleware, async (req: Request, res: Response) => {
    const {user, ...requestBody} = req.body;

    const storyData = {
        ...requestBody,
        author: user.id,
        owner: user.id
    }

    const newStory = await prismaClient.story.create({
        data: storyData
    })

    res.status(201).send(req.params.id)
})

storyRouter.put("/:id", authMiddleware, async (req: Request, res: Response) => {
    const {user, ...requestBody} = req.body;

    console.log(requestBody);

    const editedStory = await prismaClient.story.update({
        where: {
            id: parseInt(req.params.id)
        },
        data: {
            ...requestBody
        }
    })

    res.status(200).send(editedStory)
})

export default storyRouter;

