import { Router, type Request, type Response } from "express";
import { PrismaClient } from "@prisma/client";
import authMiddleware, { optionalAuthMiddleware } from "../../middlewares/authMiddleware";
import asyncHandler from "../../handlers/asyncHandler";
import { filesUpload } from "../../utils/minio";
import {OwnedOrPublishedStory, OwnedStory, PublishedStory} from "./DbFilters";

const prismaClient = new PrismaClient();
const storyRouter = Router();

const includeAll = {
  titleImage: true,
  chapters: { include: { StoryStep: true } }
}

/**
 * Get all stories that are not in a draft state
 */
storyRouter.get(
  "/",
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
  "/mine",
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
 * Get a single story by ID, including chapters and steps, if owned or published.
 */
storyRouter.get(
  "/:storyId",
  optionalAuthMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user;
    const storyId = parseInt(req.params.storyId, 10);

    const story = await prismaClient.story.findUniqueOrThrow({
      where: {
        id: storyId,
        ...OwnedOrPublishedStory(user?.id),
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

    const newStory = await prismaClient.story.create({ data: storyData });
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

    const newStory = await prismaClient.story.create({ data: storyData });
    return res.status(201).json(newStory.id);
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

    const editedStory = await prismaClient.story.update({
      where: {
        id: storyId,
        ...OwnedStory(user.id),
      },
      data: req.body,
    });

    return res.status(200).json(editedStory);
  })
);

/**
 * Delete a story (must be the owner).
 */
storyRouter.delete(
  "/:storyId",
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const storyId = parseInt(req.params.storyId, 10);

    await prismaClient.story.delete({
      where: {
        id: storyId,
        ...OwnedStory(user.id),
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


    let newFile = await prismaClient.file.create({ data: fileData });

    await prismaClient.story.update({
      where: {
        id: storyId,
        ...OwnedStory(user.id),
      },
      data: {
        titleImageId: newFile.id,
      },
    });

    return res.status(201).json(newFile);
  })
);

export default storyRouter;
