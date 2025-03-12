import { Router, type Request, type Response } from "express";
import { Prisma, PrismaClient } from "@prisma/client";
import authMiddleware from "../middlewares/authMiddleware.ts";
import { filesUpload } from "../utils/minio.ts";
import type { DefaultArgs } from "@prisma/client/runtime/library";

const prismaClient = new PrismaClient();

/**
 * Defines routes for managing stories, including creating, retrieving, updating, and uploading cover images.
 *
 * - GET "/" retrieves all stories with their title images and chapters.
 * - GET "/:storyId" retrieves a specific story by ID, including its title image and chapters.
 * - POST "/:storyId" update a specific story by ID.
 * - POST "/" creates a new story with the authenticated user's ID as the author and owner.
 * - POST "/draft" creates a draft story with empty title and description for the authenticated user.
 * - POST "/:storyId/cover" uploads a cover image for a story using MinIO for storage.
 * - GET "/:storyId/chapter" retrieves all chapters for a specific story.
 * - POST "/:storyId/chapter" creates or updates a chapter for a specific story.
 * - POST "/:chapterId/step" creates or updates a step within a chapter.
 * - GET "/:chapterId/step" retrieves all steps for a specific chapter.
 * - PUT "/:storyId" updates an existing story with new data.
 *
 */

const storyRouter = Router()

storyRouter.get("/", async (req: Request, res: Response) => {
    const stories = await prismaClient.story.findMany({
        include: {
            titleImage: true,
            chapters: {
                include: {
                    StoryStep: true
                }
            },
        }
    });
    res.status(200).json(stories)
})

storyRouter.get("/:storyId", async (req: Request, res: Response) => {
    const story = await prismaClient.story.findUniqueOrThrow({
        where: {
            id: parseInt(req.params.storyId)
        },
        include: {
            titleImage: true,
            chapters: {
                include: {
                    StoryStep: true
                }
            },
        }
    })
    res.status(200).json(story)
})

storyRouter.post("/:storyId", authMiddleware, async (req: Request, res: Response) => {
    const {user, ...requestBody} = req.body;

    const storyData = {
        ...requestBody,
        author: user.id,
        owner: user.id
    }

    const newStory = await prismaClient.story.create({
        data: storyData
    })

    res.status(201).json(newStory.id)
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

    res.status(201).json(newStory.id)
})

storyRouter.post("/draft", authMiddleware, async (req: Request, res: Response) => {
    const {user} = req.body;

    const storyData = {
        title: "",
        description: "",
        author: user.id,
        owner: user.id
    }

    const newStory = await prismaClient.story.create({
        data: storyData
    })

    console.log(newStory)

    res.status(201).json(newStory.id)
})

storyRouter.post("/:storyId/cover", authMiddleware, filesUpload.single('files'), async (req: Request, res: Response) => {
    const minioMetaData = req.file;

    if (minioMetaData == null) {
        return res.status(500).json({
            message: "file not found",
            status: 500
        });
    }

    const file = {
        fileContext: `stories/${req.params.storyId}`,
        filename: minioMetaData.originalname,
        mimetype: minioMetaData.mimetype,
        // @ts-ignore
        bucket: minioMetaData.bucket, // TODO: make it shut up, and test if it works
        encoding: minioMetaData.encoding,
        key: minioMetaData.filename,
        provider: 'minio',
        providerMetaData: JSON.stringify(minioMetaData),
    }

    let newFile;

    try {
        newFile = await prismaClient.file.create({data: file});
    } catch (e: any) {
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
                id: parseInt(req.params.storyId)
            },
            data: {
                titleImageId: newFile.id,
            }
        })
    } catch (e: any) {
        res.status(500).json({
            message: e.message,
            status: 500,
            stack: e.stack
        });
        throw e;
    }

    return res.status(201).json(newFile);
})

storyRouter.get("/:storyId/chapter", authMiddleware, async (req: Request, res: Response) => {
    const {user, ...requestBody} = req.body;
    const storyId = parseInt(req.params.storyId);

    const chapters = await prismaClient.chapter.findMany({
        where: {
            storyId: storyId
        }
    })

    res.status(200).json(chapters);
})

storyRouter.post("/:storyId/chapter", authMiddleware, async (req: Request, res: Response) => {
    const {user, ...requestBody} = req.body;
    const storyId = parseInt(req.params.storyId);

    const newChapter = {...requestBody}
    let newlyCreatedChapterId;

    if (newChapter.id) {
        // Update existing chapter
        await prismaClient.chapter.upsert({
            where: {
                id: newChapter.id,
                storyId: storyId
            },
            update: {
                ...newChapter,
                storyId: storyId
            },
            create: {
                ...newChapter,
                storyId: storyId
            }
        })
    } else {
        // Create a new chapter if no `id`
        newlyCreatedChapterId = (await prismaClient.chapter.create({
            data: {
                ...newChapter,
                storyId: storyId
            }
        })).id
    }

    res.status(200).json(newlyCreatedChapterId);
})

storyRouter.post("/:chapterId/step", authMiddleware, async (req: Request, res: Response) => {
    console.log("Step endpoint")
    const {user, ...requestBody} = req.body;
    const chapterId = parseInt(req.params.chapterId);

    const newStep = {...requestBody}

    // TODO: this is weird, can it not just use the chapterId to make the reference?
    const chapter = await prismaClient.chapter.findUniqueOrThrow({
        where: {
            id: chapterId
        }
    })

    if (newStep.id) {
        // Update existing step
        await prismaClient.storyStep.upsert({
            where: {
                id: newStep.id,
                chapterId: chapterId
            },
            update: {
                ...newStep,
                chapter: chapter
            },
            create: {
                ...newStep,
                chapter: chapter
            }
        })
    } else {
        // Create a new step if no `id`
        await prismaClient.storyStep.create({
            data: {
                ...newStep,
                // chapterId: chapterId
                navigation3D: {
                    cameraPosition: newStep.navigation3D.cameraPosition,
                    heading: newStep.navigation3D.heading,
                    pitch: newStep.navigation3D.pitch
                },
                chapter: {
                    connect: {id: chapterId}
                }
            }
        })
    }

    res.status(200).json();
})

storyRouter.get("/:chapterId/step", authMiddleware, async (req: Request, res: Response) => {
    console.log("Step endpoint")
    const {user, ...requestBody} = req.body;
    const chapterId = parseInt(req.params.chapterId);

    const steps = await prismaClient.storyStep.findMany({
        where: {
            chapterId: chapterId
        }
    })

    res.status(200).json(steps);
})

storyRouter.put("/:storyId", authMiddleware, async (req: Request, res: Response) => {
    const {user, ...requestBody} = req.body;

    const editedStory = await prismaClient.story.update({
        where: {
            id: parseInt(req.params.storyId)
        },
        data: {
            ...requestBody
        }
    })

    res.status(200).json(editedStory)
})

export default storyRouter;

