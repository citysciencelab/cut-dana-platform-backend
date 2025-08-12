import {Router, type Request, type Response} from "express";
import {PrismaClient} from "@prisma/client";
import authMiddleware, {optionalAuthMiddleware} from "../../middlewares/authMiddleware";
import asyncHandler from "../../handlers/asyncHandler";
import {filesUpload} from "../../utils/minio";
import {OwnedOrPublishedStory, OwnedStory, PublishedStory } from "./DbFilters";
import {userIsAdmin} from "../../types/User.ts";

const prismaClient = new PrismaClient();
const storyRouter = Router();

const includeAll = {
  titleImage: true,
  chapters: {include: {StoryStep: true}}
}

/**
 * Get all stories that are not in a draft state
 */
storyRouter.get(
  "/all",
  asyncHandler(async (req: Request, res: Response) => {
    const stories = await prismaClient.story.findMany({
      where: PublishedStory,
      include: includeAll,
    });

    return res.status(200).json(stories);
  })
);

/**
 * Get all stories that are not in a draft state and have featured on true
 */
storyRouter.get(
  "/featured",
  asyncHandler(async (req: Request, res: Response) => {
    const story = await prismaClient.story.findMany({
      where: {
        ...PublishedStory,
        featured: true
      },
      include: includeAll,
    });

    return res.status(200).json(story);
  })
);

/**
 * Get all stories that are not in a draft state ordered by views
 */
storyRouter.get(
  "/popular",
  asyncHandler(async (req: Request, res: Response) => {
    const story = await prismaClient.story.findMany({
      where: {
        ...PublishedStory,
      },
      include: includeAll,
      orderBy: {
        views: "desc",
      }
    });

    return res.status(200).json(story);
  })
);

/**
 * Get all stories that are owned by me, draft or not
 */
storyRouter.get(
  "/my",
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;

    const story = await prismaClient.story.findMany({
      where: OwnedStory(user.id),
      include: includeAll,
    });

    return res.status(200).json(story);
  })
);


/**
 * Get a single story by ID, including chapters and steps, if owned, published or user is admin.
 */
storyRouter.get(
  "/:storyId",
  optionalAuthMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user;
    const storyId = parseInt(req.params.storyId, 10);

    let extraCheck = {};

    if (!user || !userIsAdmin(user)) {
      extraCheck = OwnedOrPublishedStory(user?.id);
    }

    const story = await prismaClient.story.findUniqueOrThrow({
      where: {
        id: storyId,
        ...extraCheck,
      },
      include: includeAll,
    });

    return res.status(200).json(story);
  })
);

/**
 * Create a new story (not a draft).
 */
storyRouter.post(
  "/",
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;

    const storyData = {
      ...req.body,
      author: user.id,
      owner: user.id,
    };

    const newStory = await prismaClient.story.create({data: storyData});
    return res.status(201).json(newStory.id);
  })
);

/**
 * Create an empty draft story.
 */
storyRouter.post(
  "/draft",
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;

    const storyData = {
      title: "",
      description: "",
      author: user.id,
      owner: user.id,
    };

    const newStory = await prismaClient.story.create({data: storyData});
    return res.status(201).json(newStory.id);
  })
);

/**
 * Create an empty draft story.
 */
storyRouter.post(
  "/:storyId/featured/:boolean",
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const storyId = parseInt(req.params.storyId, 10);
    const boolean = Boolean(JSON.parse(req.params.boolean));

    if (!userIsAdmin(user)) {
      return res
        .status(403)
        .json({ error: "You are not authorized to modify this story." });
    }

    const editedStory = await prismaClient.story.update({
      where: {
        id: storyId,
      },
      data: {
        featured: boolean
      },
    });

    return res.status(201);
  })
);

/**
 * increment story's view counter
 */
storyRouter.post(
  "/:storyId/play",
  asyncHandler(async (req: Request, res: Response) => {
    const storyId = parseInt(req.params.storyId, 10);

    const editedStory = await prismaClient.story.update({
      where: {
        id: storyId,
      },
      data: {
        views: {increment: 1}
      },
    });

    return res.status(200);
  })
);

/**
 * Update an existing story (must be the owner).
 */
storyRouter.put(
  "/:storyId",
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const storyId = parseInt(req.params.storyId, 10);

    let extraCheck = {};

    if (!userIsAdmin(user)) {
      extraCheck = OwnedStory(user.id);
    }

    const editedStory = await prismaClient.story.update({
      where: {
        id: storyId,
        ...extraCheck,
      },
      data: req.body,
    });

    return res.status(200).json(editedStory);
  })
);

/**
 * Delete a story (must be the owner or an admin).
 */
storyRouter.delete(
  "/:storyId",
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const storyId = parseInt(req.params.storyId, 10);

    let extraCheck = {};

    if (!userIsAdmin(user)) {
      extraCheck = OwnedStory(user.id);
    }

    await prismaClient.story.delete({
      where: {
        id: storyId,
        ...extraCheck
      },
    });

    return res.status(200).json();
  })
);

/**
 * Update a story’s cover image (must be the owner).
 */
storyRouter.post(
  "/:storyId/cover",
  authMiddleware,
  filesUpload.single("files"),
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const storyId = parseInt(req.params.storyId, 10);

    const minioMetaData = req.file;

    if (!minioMetaData) {
      return res.status(500).json({
        message: "file not found",
        status: 500,
      });
    }

    const fileData = {
      fileContext: `stories/${storyId}`,
      filename: minioMetaData.originalname,
      mimetype: minioMetaData.mimetype,
      bucket: process.env.MINIO_BUCKET!,
      encoding: minioMetaData.encoding,
      key: minioMetaData.filename,
      provider: "minio",
      providerMetaData: JSON.stringify(minioMetaData),
    };


    let newFile = await prismaClient.file.create({data: fileData});

    let extraCheck = {};

    if (!userIsAdmin(user)) {
      extraCheck = OwnedStory(user.id);
    }

    await prismaClient.story.update({
      where: {
        id: storyId,
        ...extraCheck,
      },
      data: {
        titleImageId: newFile.id,
      },
    });

    return res.status(201).json(newFile);
  })
);

/** NEW **/

storyRouter.post(
    "/new",
    authMiddleware,
    asyncHandler(async (req: Request, res: Response) => {
        const user = req.user!;

        const {title, chapters} = req.body as {
            title: string;
            chapters: Array<{
                title: string;
                sequence: number;
                steps: Array<{
                    title: string;
                    description: string;
                    mapConfig: {
                        centerCoordinates: number[];
                        zoomLevel: number;
                        backgroundMapId: string;
                    };
                    informationLayerIds?: string[];
                }>;
            }>;
        };

        const newStory = await prismaClient.$transaction(async (tx) => {
            return tx.story.create({
                data: {
                    title,
                    description: "",
                    author: user.id,
                    owner: user.id,
                    isDraft: false,
                    chapters: {
                        create: chapters.map((chap) => ({
                            name: chap.title,
                            sequence: chap.sequence,
                            StoryStep: {
                                create: chap.steps.map((step, stepIdx) => ({
                                    stepNumber: stepIdx + 1,
                                    stepWidth: step.stepWidth ?? 0,
                                    visible: step.visible ?? true,
                                    title: step.title,
                                    html: step.description,
                                    centerCoordinate: step.mapConfig.centerCoordinates,
                                    zoomLevel: step.mapConfig.zoomLevel,
                                    backgroundMapId: step.mapConfig.backgroundMapId,
                                    interactionAddons: step.interactionAddons ?? [],
                                    is3D: step.is3D ?? false,
                                    navigation3D: step.navigation3D ?? {},
                                    informationLayerIds: (step.informationLayerIds ?? []).map(String),
                                }))
                            }
                        }))
                    }
                },
                include: {
                    chapters: {
                        include: {StoryStep: true}
                    }
                }
            });
        });

        return res.status(201).json(newStory);
    })
);

storyRouter.get(
    "/new/:storyId",
    optionalAuthMiddleware,
    asyncHandler(async (req: Request, res: Response) => {
        const storyId = parseInt(req.params.storyId);

        const raw = await prismaClient.story.findFirstOrThrow({
            where: {
                id: storyId,
                isDraft: false
            },
            select: {
                id: true,
                title: true,
                chapters: {
                    orderBy: {sequence: "asc"},
                    select: {
                        id: true,
                        name: true,
                        sequence: true,
                        StoryStep: {
                            orderBy: {stepNumber: "asc"},
                            select: {
                                id: true,
                                stepNumber: true,
                                title: true,
                                html: true,
                                centerCoordinate: true,
                                zoomLevel: true,
                                backgroundMapId: true,
                                informationLayerIds: true,
                            }
                        }
                    }
                }
            }
        })

        const story = {
            id: raw.id,
            title: raw.title,
            chapters: raw.chapters.map(chap => {
                const { StoryStep, ...chapRest } = chap;
                return {
                    ...chapRest,
                    steps: StoryStep
                };
            })
        };

        return res.status(200).json(story);
    })
);

storyRouter.put(
    "/new/:storyId",
    authMiddleware,
    asyncHandler(async (req: Request, res: Response) => {
        const user = req.user!;
        const storyId = parseInt(req.params.storyId, 10);
        const body = req.body as {
            title: string;
            chapters: Array<{
                title: string;
                sequence: number;
                steps: Array<{
                    title: string;
                    description: string;
                    mapConfig: {
                        centerCoordinates: number[];
                        zoomLevel: number;
                        backgroundMapId: string | null;
                    };
                    informationLayerIds?: string[];
                }>;
            }>;
        };

        if (!userIsAdmin(user)) {
            const own = await prismaClient.story.findFirst({
                where: { id: storyId, owner: user.id },
                select: { id: true }
            });

            if (!own) return res.status(403).json({ message: "Forbidden" });
        }

        await prismaClient.$transaction(async (tx) => {
            await tx.story.update({
                where: { id: storyId },
                data: { title: body.title }
            });

            const chapterIds = await tx.chapter.findMany({
                where: { storyId },
                select: { id: true }
            });

            if (chapterIds.length) {
                await tx.storyStep.deleteMany({
                    where: { chapterId: { in: chapterIds.map(c => c.id) } }
                });
                await tx.chapter.deleteMany({ where: { storyId } });
            }

            for (const chap of body.chapters ?? []) {
                const newChapter = await tx.chapter.create({
                    data: {
                        storyId,
                        name: chap.title,
                        sequence: chap.sequence,
                    },
                    select: { id: true }
                });

                const steps = chap.steps ?? [];
                for (let i = 0; i < steps.length; i++) {
                    const s = steps[i];
                    await tx.storyStep.create({
                        data: {
                            chapterId: newChapter.id,
                            stepNumber: i + 1,
                            stepWidth: 0,
                            visible: true,
                            title: s.title,
                            html: s.description,
                            centerCoordinate: s.mapConfig.centerCoordinates,
                            zoomLevel: s.mapConfig.zoomLevel,
                            backgroundMapId: s.mapConfig.backgroundMapId ?? null,
                            interactionAddons: [],
                            is3D: false,
                            navigation3D: {},
                            informationLayerIds: (s.informationLayerIds ?? []).map(String),
                        }
                    });
                }
            }
        });

        return res.status(200).json({ success: true, message: "Updated story" });
    })
);

export default storyRouter;
