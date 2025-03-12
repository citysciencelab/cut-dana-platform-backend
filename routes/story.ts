import {Router, type Request, type Response} from "express";
import {PrismaClient} from "@prisma/client";
import authMiddleware from "../middlewares/authMiddleware.ts";
import {filesUpload} from "../utils/minio.ts";

const prismaClient = new PrismaClient();

const storyRouter = Router()

storyRouter.get("/", async (req: Request, res: Response) => {
    const stories = await prismaClient.story.findMany({
        include: {
            titleImage: true,
            chapters: true,
        }
    });
    res.status(200).send(stories)
})

storyRouter.get("/:storyId", async (req: Request, res: Response) => {
    const story = await prismaClient.story.findUniqueOrThrow({
        where: {
            id: parseInt(req.params.storyId)
        },
        include: {
            titleImage: true,
            chapters: true,
        }
    })
    res.status(200).send(story)
})

storyRouter.post("/", authMiddleware, async (req: Request, res: Response) => {
    console.log("log")
    console.log(req.body);
    const {user, ...requestBody} = req.body;


    const storyData = {
        ...requestBody,
        author: user.id,
        owner: user.id
    }

    const newStory = await prismaClient.story.create({
        data: storyData
    })

    res.status(201).send(req.params.storyId)
})

storyRouter.post("/:storyId/cover", authMiddleware, filesUpload.single('files'), async (req: Request, res: Response) => {
    const minioMetaData = req.file;

    if (minioMetaData == null){
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
        newFile = await prismaClient.file.create({data:file});
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

    return res.status(201).send(newFile);
})

storyRouter.post("/:storyId/chapter", authMiddleware, async (req: Request, res: Response) => {
    const {user, ...requestBody} = req.body;
    const storyId = parseInt(req.params.storyId);

    const newChapter = {...requestBody}

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
        await prismaClient.chapter.create({
            data: {
                ...newChapter,
                storyId: storyId
            }
        })
    }

    res.status(200).send();
})

storyRouter.post("/:storyId/:chapterId/step", authMiddleware, async (req: Request, res: Response) => {
    console.log("Step endpoint")
    const {user, ...requestBody} = req.body;
    const storyId = parseInt(req.params.storyId);
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
                chapter: chapter
            }
        })
    }

    res.status(200).send();
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

    res.status(200).send(editedStory)
})

export default storyRouter;

