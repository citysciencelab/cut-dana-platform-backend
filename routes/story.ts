import { Router, type Request, type Response } from "express";
import { PrismaClient } from "@prisma/client";
import authMiddleware from "../middlewares/authMiddleware.ts";
import { filesUpload } from "../utils/minio.ts";

const prismaClient = new PrismaClient();

const storyRouter = Router()

// TODO: auth checks

//#region Story
// get all stories
storyRouter.get("/", async (req: Request, res: Response) => {
    // TODO: filter on draft boolean, if the use calling this has stories in draft, do add those
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

// get story by id
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

// create new story
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

// create new story draft
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

    res.status(201).json(newStory.id)
})

// update story
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

// update story cover
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
//#endregion

//#region Chapter
// get all chapters for a story
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

// add a chapter to a story
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

// delete a chapter
storyRouter.delete("/chapter/:chapterId", authMiddleware, async (req: Request, res: Response) => {
    const {user} = req.body;
    const chapterId = parseInt(req.params.chapterId);

    try {
        await prismaClient.chapter.delete({
            where: {
                id: chapterId,
            }
        })
        res.status(200).json();
    } catch (e) {
        res.status(500).json(e)
    }
})
//#endregion

//#region Step
// get all steps for a chapter
storyRouter.get("/chapter/:chapterId/step", authMiddleware, async (req: Request, res: Response) => {
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

// add a step to a chapter
storyRouter.post("/chapter/:chapterId/step", authMiddleware, async (req: Request, res: Response) => {
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

// delete a step from a chapter
storyRouter.delete("/step/:stepId", authMiddleware, async (req: Request, res: Response) => {
    const {user} = req.body;
    const stepId = parseInt(req.params.stepId);

    try {
        await prismaClient.storyStep.delete({
            where: {
                id: stepId,
            }
        })
        res.status(200).json();
    } catch (e) {
        res.status(500).json(e)
    }
})
//#endregion

export default storyRouter;

