import { Router, type Request, type Response } from "express";
import { PrismaClient } from "@prisma/client";
import authMiddleware, { optionalAuthMiddleware } from "../../middlewares/authMiddleware";
import asyncHandler from "../../handlers/asyncHandler";
import { filesUpload } from "../../utils/minio";
import { OwnedOrPublishedStory, OwnedStory } from "./DbFilters";

const prismaClient = new PrismaClient();
const storyRouter = Router();

/**
 * Get all stories, including those owned by the user or publicly available.
 */
storyRouter.get(
  "/",
  optionalAuthMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const { user } = req.body;

    const stories = await prismaClient.story.findMany({
      where: OwnedOrPublishedStory(user?.id),
      include: {
        titleImage: true,
        chapters: { include: { StoryStep: true } },
      },
    });

    return res.status(200).json(stories);
  })
);

/**
 * Get a single story by ID, including chapters and steps, if owned or published.
 */
storyRouter.get(
  "/:storyId",
  optionalAuthMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const { user } = req.body;
    const storyId = parseInt(req.params.storyId, 10);

    const story = await prismaClient.story.findUniqueOrThrow({
      where: {
        id: storyId,
        ...OwnedOrPublishedStory(user?.id),
      },
      include: {
        titleImage: true,
        chapters: { include: { StoryStep: true } },
      },
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
    const { user, ...requestBody } = req.body;

    const storyData = {
      ...requestBody,
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
    const { user } = req.body;

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
    const { user, ...requestBody } = req.body;
    const storyId = parseInt(req.params.storyId, 10);

    const editedStory = await prismaClient.story.update({
      where: {
        id: storyId,
        ...OwnedStory(user.id),
      },
      data: {
        ...requestBody,
      },
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
    const { user } = req.body;
    const storyId = parseInt(req.params.storyId, 10);

    try {
      await prismaClient.story.delete({
        where: {
          id: storyId,
          ...OwnedStory(user.id),
        },
      });
      return res.status(200).json();
    } catch (error) {
      return res.status(500).json(error);
    }
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
    const { user } = req.body;
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
      // @ts-ignore  -- Type definitions for Multer Minio might require an update
      bucket: minioMetaData.bucket,
      encoding: minioMetaData.encoding,
      key: minioMetaData.filename,
      provider: "minio",
      providerMetaData: JSON.stringify(minioMetaData),
    };

    let newFile;
    try {
      newFile = await prismaClient.file.create({ data: fileData });
    } catch (error: any) {
      res.status(500).json({
        message: error.message,
        status: 500,
        stack: error.stack,
      });
      throw error;
    }

    try {
      await prismaClient.story.update({
        where: {
          id: storyId,
          ...OwnedStory(user.id),
        },
        data: {
          titleImageId: newFile.id,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        message: error.message,
        status: 500,
        stack: error.stack,
      });
      throw error;
    }

    return res.status(201).json(newFile);
  })
);

export default storyRouter;
