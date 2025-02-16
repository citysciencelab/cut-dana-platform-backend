import express, {Router, type Request, type Response} from "express";
import {PrismaClient, type Story} from "@prisma/client";
import type {CreateStoryBody} from "./Story/CreateStory/createStoryBody.ts";
import authMiddleware, {bareboneAuthMiddleware} from "../middlewares/authMiddleware.ts";
import stepRouter from "./step.ts";
import {filesUpload} from "../utils/minio.ts";

const prismaClient = new PrismaClient();

const storyRouter = Router()

storyRouter.get("/", async (req: Request, res: Response) => {
    const stories = await prismaClient.story.findMany({
        include: {
            titleImage: true,
        }
    });
    res.status(200).send(stories)
})

storyRouter.get("/:id", async (req: Request, res: Response) => {
    const story = await prismaClient.story.findUniqueOrThrow({
        where: {
            id: parseInt(req.params.id)
        },
        include: {
            titleImage: true,
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

storyRouter.post("/:id/cover", filesUpload.single('files'), async (req: Request, res: Response) => {
    const minioMetaData = req.file;

    const file = {
        fileContext: `stories/${req.params.id}`,
        filename: minioMetaData.originalname,
        mimetype: minioMetaData.mimetype,
        bucket: minioMetaData.bucket,
        encoding: minioMetaData.encoding,
        key: minioMetaData.filename,
        provider: 'minio',
        providerMetaData: JSON.stringify(minioMetaData),
    }

    let newFile;

    try {
        newFile = await prismaClient.file.create({data:file});
    } catch (e) {
        res.status(500).json({
            message: e.message,
            status: 500,
            stack: e.stack
        });
        throw e;
    }

    try {
        const story = await prismaClient.story.update({
            where: {
                id: parseInt(req.params.id)
            },
            data: {
                titleImageId: newFile.id,
            }
        })
    } catch (e) {
        res.status(500).json({
            message: e.message,
            status: 500,
            stack: e.stack
        });
        throw e;
    }

    return res.status(201).send(newFile);
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

