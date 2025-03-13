import { Router, type Request, type Response } from "express";
import { PrismaClient } from "@prisma/client";
import authMiddleware from "../../middlewares/authMiddleware";
import asyncHandler from "../../handlers/asyncHandler";
import {userOwnsStory} from "./DbFilters.ts";

const prismaClient = new PrismaClient();
const stepRouter = Router();

/**
 * Get all steps for a given chapter (must be authenticated and own the story).
 */
stepRouter.get(
  "/:storyId/chapter/:chapterId/step",
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const chapterId = parseInt(req.params.chapterId, 10);

    const steps = await prismaClient.storyStep.findMany({
      where: { chapterId },
    });

    return res.status(200).json(steps);
  })
);

/**
 * Create or update a step for a given chapter if the user owns the story.
 */
stepRouter.post(
  "/:storyId/chapter/:chapterId/step",
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const { user, ...stepData } = req.body;
    const storyId = parseInt(req.params.storyId, 10);
    const chapterId = parseInt(req.params.chapterId, 10);

    if (!await userOwnsStory(storyId, user.id)) {
      return res
        .status(403)
        .json({ error: "You are not authorized to add steps to this story." });
    }

    const chapter = await prismaClient.chapter.findUniqueOrThrow({
      where: { id: chapterId },
    });

    if (stepData.id) {
      // Update an existing step
      await prismaClient.storyStep.upsert({
        where: {
          id: stepData.id,
          chapterId,
        },
        update: { ...stepData, chapter },
        create: { ...stepData, chapter },
      });
    } else {
      // Create a new step
      await prismaClient.storyStep.create({
        data: {
          ...stepData,
          navigation3D: {
            cameraPosition: stepData.navigation3D?.cameraPosition,
            heading: stepData.navigation3D?.heading,
            pitch: stepData.navigation3D?.pitch,
          },
          chapter: { connect: { id: chapterId } },
        },
      });
    }

    return res.status(200).json();
  })
);

/**
 * Delete a step from a chapter if the user owns the story.
 */
stepRouter.delete(
  "/:storyId/chapter/:chapterId/step/:stepId",
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const { user } = req.body;
    const storyId = parseInt(req.params.storyId, 10);
    const stepId = parseInt(req.params.stepId, 10);

    if (!await userOwnsStory(storyId, user.id)) {
      return res
        .status(403)
        .json({ error: "You are not authorized to delete steps from this story." });
    }

    await prismaClient.storyStep.delete({
      where: { id: stepId },
    });

    return res.status(200).json();
  })
);

export default stepRouter;
