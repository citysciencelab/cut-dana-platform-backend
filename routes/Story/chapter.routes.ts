import { Router, type Request, type Response } from "express";
import { PrismaClient } from "@prisma/client";
import authMiddleware from "../../middlewares/authMiddleware";
import asyncHandler from "../../handlers/asyncHandler";
import {userIsOwnerOrAdmin } from "./DbFilters.ts";

const prismaClient = new PrismaClient();
const chapterRouter = Router();

/** TODO: should the user be authenticated? not strictly necessary IF the project is published?
 * Get all chapters for a given story (must be authenticated).
 */
chapterRouter.get(
  "/:storyId/chapter",
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const storyId = parseInt(req.params.storyId, 10);

    const chapters = await prismaClient.chapter.findMany({
      where: { storyId },
    });

    return res.status(200).json(chapters);
  })
);

/**
 * Create or update a chapter (upsert) for a given story if the user owns it or is admin.
 */
chapterRouter.post(
  "/:storyId/chapter",
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const chapterData = req.body;
    const storyId = parseInt(req.params.storyId, 10);

    if (!await userIsOwnerOrAdmin(storyId, user)) {
      return res
        .status(403)
        .json({ error: "You are not authorized to add chapters to this story." });
    }

    // If 'id' is provided, update; otherwise create
    if (chapterData.id) {
      await prismaClient.chapter.upsert({
        where: {
          id: chapterData.id,
          storyId,
        },
        update: {
          ...chapterData,
          storyId,
        },
        create: {
          ...chapterData,
          storyId,
        },
      });
      return res.status(200).json(chapterData.id);
    } else {
      const newlyCreatedChapter = await prismaClient.chapter.create({
        data: {
          ...chapterData,
          storyId,
        },
      });
      return res.status(201).json(newlyCreatedChapter.id);
    }
  })
);

/**
 * Delete a chapter from a story if the user owns the story.
 */
chapterRouter.delete(
  "/:storyId/chapter/:chapterId",
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const storyId = parseInt(req.params.storyId, 10);
    const chapterId = parseInt(req.params.chapterId, 10);

    if (!await userIsOwnerOrAdmin(storyId, user)) {
      return res
          .status(403)
          .json({ error: "You are not authorized to delete chapters from this story." });
    }

    await prismaClient.chapter.delete({
      where: { id: chapterId },
    });

    return res.status(200).json();
  })
);

export default chapterRouter;
