import {type Request, type Response, Router} from "express";
import {Prisma, PrismaClient} from "@prisma/client";
import authMiddleware, {isRequestFromAdmin, optionalAuthMiddleware} from "../../middlewares/authMiddleware";
import asyncHandler from "../../handlers/asyncHandler";
import {filesUpload, minioClient} from "../../utils/minio";
import {OwnedStory, PublishedStory, userOwnsStory} from "./DbFilters";
import type {GeoJSONAsset, InformationLayer} from "../../prisma/interfaces.ts";
import {setupLogger} from '../../utils/logger.ts';
import {deleteStoryWithResources} from "./deleteStoryWithResources.ts";

const logger = setupLogger({label: 'storyRouter'});

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
 * Toggle 'featured' flag (admin only)
 */
storyRouter.post(
  "/:storyId/featured/:boolean",
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const storyId = Number(req.params.storyId);

    if (!(await isRequestFromAdmin(req))) {
      return res.status(403).json({error: "You are not authorized to modify this story."});
    }

    const raw = String(req.params.boolean).toLowerCase();
    if (raw !== "true" && raw !== "false") {
      return res.status(400).json({error: "Boolean must be 'true' or 'false'."});
    }
    const featured = raw === "true";

    const updated = await prismaClient.story.update({
      where: {id: storyId},
      data: {featured},
    });

    return res.status(200).json(updated);
  })
);

/**
 * increment story's view counter
 */
storyRouter.post(
  "/:storyId/play",
  asyncHandler(async (req: Request, res: Response) => {
    const storyId = parseInt(req.params.storyId, 10);
    if (!storyId || isNaN(storyId)) {
      return res.status(400).json({error: "Invalid story ID"});
    }

    await prismaClient.story.update({
      where: {
        id: storyId,
      },
      data: {
        views: {increment: 1}
      },
    });

    return res.status(200).send();
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

    if (!(await isRequestFromAdmin(req))) {
      extraCheck = OwnedStory(user.id);
    }
    try {
      await deleteStoryWithResources(prismaClient, {
        id: storyId,
        ...extraCheck,
      });
    } catch (error) {
      if (error instanceof Error && error.message === "Failed to delete story files from storage") {
        return res.status(500).json({message: error.message});
      }

      throw error;
    }

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

    if (!(await isRequestFromAdmin(req))) {
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

storyRouter.delete(
  "/:storyId/cover",
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const storyId = parseInt(req.params.storyId, 10);

    let extraCheck = {};

    if (!(await isRequestFromAdmin(req))) {
      extraCheck = OwnedStory(user.id);
    }

    const imageID = await prismaClient.story.findFirstOrThrow({
      where: {
        id: storyId,
        ...extraCheck,
      },
      select: {
        titleImageId: true,
      },
    });

    if (!imageID.titleImageId) {
      return res.status(404).json({message: "No cover image to delete"});
    }

    const imageObject = await prismaClient.file.findFirstOrThrow({
      where: {
        id: imageID.titleImageId,
      },
    });

    // delete image from bucket
    if (minioClient) {
      try {
        await minioClient.removeObject(imageObject.bucket, imageObject.key);
      } catch (error) {
        return res.status(500).json({message: "Error deleting image from storage", error});
      }
    }

    try {
      // delete image from database
      await prismaClient.file.delete({
        where: {
          id: imageID.titleImageId!,
        },
      });
    } catch (error) {
      return res.status(500).json({message: "Error deleting image from database", error});
    }

    try {
      // remove image from story
      await prismaClient.story.update({
        where: {
          id: storyId,
          ...extraCheck,
        },
        data: {
          titleImageId: null,
        },
      });
    } catch (error) {
      return res.status(500).json({message: "Error removing image from story", error});
    }

    return res.status(200).json();
  })
);

/** NEW **/

storyRouter.post(
  "/new",
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;

    const {title, description, chapters, scrollytelling, playerWidth, playerHeight, autoplayEnabled, autoplayIntervalSec, hideBackButton} = req.body as {
      title: string;
      description: string;
      scrollytelling?: boolean;
      playerWidth?: number;
      playerHeight?: number;
      autoplayEnabled?: boolean;
      autoplayIntervalSec?: number;
      hideBackButton?: boolean;
      chapters: Array<{
        title: string;
        sequence: number;
        steps: Array<{
          title: string;
          description: string;
          stepWidth?: number;
          visible?: boolean;
          is3D?: boolean;
          navigation3D?: any;
          models3D?: any[];
          layers3D?: any[];
          interactionAddons?: string[];
          mapConfig: {
            centerCoordinates: number[];
            zoomLevel: number;
            backgroundMapId: string;
          };
          informationLayers?: InformationLayer[];
          mapSources?: any[];
          geoJsonAssets?: GeoJSONAsset[];
        }>;
      }>;
    };

    if (!Array.isArray(chapters)) {
      return res.status(400).json({error: "chapters must be an array"});
    }

    const newStory = await prismaClient.$transaction(async (tx) => {
      return (tx.story as any).create({
        data: {
          title,
          description: description ?? "",
          storyInterval: typeof autoplayIntervalSec === 'number'
            ? Math.max(1000, Math.floor(autoplayIntervalSec * 1000))
            : 10000,
          autoplayEnabled: autoplayEnabled === true,
          hideBackButton: hideBackButton === true,
          scrollytelling: scrollytelling === true,
          playerWidth: typeof playerWidth === 'number' ? playerWidth : null,
          playerHeight: typeof playerHeight === 'number' ? playerHeight : null,
          author: user.id,
          owner: user.id,
          isDraft: true,
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
                  centerCoordinate: step.mapConfig?.centerCoordinates ?? [],
                  zoomLevel: step.mapConfig?.zoomLevel ?? 0,
                  backgroundMapId: step.mapConfig?.backgroundMapId ?? "",
                  interactionAddons: step.interactionAddons ?? [],
                  is3D: step.is3D ?? false,
                  navigation3D: step.navigation3D ?? {},
                  models3D: Array.isArray(step.models3D) ? step.models3D : [],
                  layers3D: Array.isArray(step.layers3D) ? step.layers3D : [],
                  informationLayers: step.informationLayers ? step.informationLayers : [],
                  mapSources: Array.isArray(step.mapSources) ? step.mapSources : [],
                  geoJsonAssets: step.geoJsonAssets ? step.geoJsonAssets : [],
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

// Upload 3d models
storyRouter.post(
  "/:storyId/steps/:stepId/model",
  authMiddleware,
  filesUpload.single("files"),
  asyncHandler(async (req: Request, res: Response) => {
    const storyId = Number(req.params.storyId);
    const stepId = Number(req.params.stepId);
    const entityId = req.query.entityId as string | undefined;

    const minioMetaData = req.file;

    if (!minioMetaData) {
      return res.status(500).json({message: "file not found", status: 500});
    }

    const fileData = {
      fileContext: `stories/${storyId}/steps/${stepId}`,
      filename: minioMetaData.originalname,
      mimetype: minioMetaData.mimetype,
      bucket: process.env.MINIO_BUCKET!,
      encoding: minioMetaData.encoding,
      key: minioMetaData.filename,
      provider: "minio",
      providerMetaData: JSON.stringify(minioMetaData),
    };

    let newFile = await prismaClient.file.create({data: fileData});

    const fileUrl = `files/${fileData.fileContext}/${fileData.filename}`;

    if (entityId) {
      // Update the matching models3D entry with the real fileUrl
      const step = await (prismaClient.storyStep as any).findUnique({
        where: {id: stepId},
        select: {models3D: true},
      });
      const models3D: any[] = (step?.models3D as any[]) ?? [];
      const idx = models3D.findIndex((m) => m.entityId === entityId);
      if (idx >= 0) {
        models3D[idx] = {...models3D[idx], fileUrl};
      } else {
        models3D.push({entityId, fileUrl});
      }
      await (prismaClient.storyStep as any).update({
        where: {id: stepId},
        data: {models3D},
      });
    }

    return res.status(201).json(newFile);
  })
);

storyRouter.get(
  "/new/:storyId",
  optionalAuthMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const storyId = parseInt(req.params.storyId);

    const raw = await (prismaClient.story as any).findFirstOrThrow({
      where: {
        id: storyId
      },
      select: {
        id: true,
        title: true,
        description: true,
        storyInterval: true,
        autoplayEnabled: true,
        hideBackButton: true,
        scrollytelling: true,
        playerWidth: true,
        playerHeight: true,
        titleImage: true,
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
                informationLayers: true,
                is3D: true,
                navigation3D: true,
                models3D: true,
                layers3D: true,
                mapSources: true,
                geoJsonAssets: true,
              }
            }
          }
        }
      }
    })

    const story = {
      id: raw.id,
      title: raw.title,
      description: raw.description,
      autoplayEnabled: raw.autoplayEnabled === true,
      autoplayIntervalSec: Math.max(1, Math.round((raw.storyInterval ?? 10000) / 1000)),
      hideBackButton: raw.hideBackButton === true,
      scrollytelling: raw.scrollytelling,
      playerWidth: raw.playerWidth ?? null,
      playerHeight: raw.playerHeight ?? null,
      titleImage: raw.titleImage,
      chapters: (raw.chapters as any[]).map((chap: any) => {
        const {StoryStep, ...chapRest} = chap;
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
      description: string;
      scrollytelling?: boolean;
      playerWidth?: number | null;
      playerHeight?: number | null;
      autoplayEnabled?: boolean;
      autoplayIntervalSec?: number;
      hideBackButton?: boolean;
      chapters: Array<{
        title: string;
        sequence: number;
        steps: Array<{
          title: string;
          description: string;
          is3D?: boolean;
          navigation3D?: any;
          models3D?: any[];
          layers3D?: any[];
          mapConfig: {
            centerCoordinates: number[];
            zoomLevel: number;
            backgroundMapId: string | null;
          };
          mapSources: {
            id: string;
            name: string;
            url: string;
            typ: string;
            layers: string[];
            version: string;
            visibility: boolean;
            showInLayerTree: boolean;
            opacity: number;
            zIndex: number;
            legendURL: string;
            transparency: number;
            infoFormat: string;
            format: string;
            gutter: number;
            origin: number[];
            singleTile: boolean;
            tilesize: number;
            transparent: boolean;
          }[];
          informationLayers?: InformationLayer[];
          geoJsonAssets?: GeoJSONAsset[];
        }>;
      }>;
    };

    logger.debug(`Updating story ${storyId} by user ${user.id}`);
    logger.info(req.body);

    if (!(await isRequestFromAdmin(req))) {
      const own = await prismaClient.story.findFirst({
        where: {id: storyId, owner: user.id},
        select: {id: true}
      });

      if (!own) return res.status(403).json({message: "Forbidden"});
    }

    await prismaClient.$transaction(async (tx) => {
      await (tx.story as any).update({
        where: {id: storyId},
        data: {
          title: body.title,
          description: body.description ?? "",
          storyInterval: typeof body.autoplayIntervalSec === 'number'
            ? Math.max(1000, Math.floor(body.autoplayIntervalSec * 1000))
            : 10000,
          autoplayEnabled: body.autoplayEnabled === true,
          hideBackButton: body.hideBackButton === true,
          scrollytelling: body.scrollytelling === true,
          playerWidth: typeof body.playerWidth === 'number' ? body.playerWidth : null,
          playerHeight: typeof body.playerHeight === 'number' ? body.playerHeight : null,
        }
      });

      const chapterIds = await tx.chapter.findMany({
        where: {storyId},
        select: {id: true}
      });

      if (chapterIds.length) {
        await tx.storyStep.deleteMany({
          where: {chapterId: {in: chapterIds.map(c => c.id)}}
        });
        await tx.chapter.deleteMany({where: {storyId}});
      }

      for (const chap of body.chapters ?? []) {
        const newChapter = await tx.chapter.create({
          data: {
            storyId,
            name: chap.title,
            sequence: chap.sequence,
          },
          select: {id: true}
        });

        const steps = chap.steps ?? [];
        for (let i = 0; i < steps.length; i++) {
          const s = steps[i];
          await (tx.storyStep as any).create({
            data: {
              chapterId: newChapter.id,
              stepNumber: i + 1,
              stepWidth: 0,
              visible: true,
              title: s.title,
              html: s.description,
              centerCoordinate: s.mapConfig.centerCoordinates,
              zoomLevel: s.mapConfig.zoomLevel,
              backgroundMapId: s.mapConfig.backgroundMapId ?? "",
              interactionAddons: [],
              is3D: s.is3D ?? false,
              navigation3D: s.navigation3D ?? {},
              models3D: s.models3D ?? [],
              layers3D: s.layers3D ?? [],
              informationLayers: s.informationLayers ?? [],
              geoJsonAssets: s.geoJsonAssets ?? [],
              mapSources: s.mapSources ?? [],
            }
          });
        }
      }
    });

    const updatedStory = await prismaClient.story.findUnique({
      where: {id: storyId},
      include: {
        chapters: {
          orderBy: {sequence: "asc"},
          include: {StoryStep: {orderBy: {stepNumber: "asc"}}}
        }
      }
    });

    return res.status(200).json(updatedStory);
  })
);

storyRouter.put(
  "/new/:storyId/publish-state",
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const storyId = parseInt(req.params.storyId, 10);
    const {isDraft} = (req.body ?? {}) as { isDraft?: boolean };

    if (typeof isDraft !== "boolean") {
      return res.status(400).json({message: "isDraft must be boolean"});
    }

    if (!(await isRequestFromAdmin(req))) {
      const own = await prismaClient.story.findFirst({
        where: {id: storyId, owner: user.id},
        select: {id: true},
      });
      if (!own) return res.status(403).json({message: "Forbidden"});
    }

    const updated = await prismaClient.story.update({
      where: {id: storyId},
      data: {
        isDraft,
      },
      include: includeAll,
    });

    return res.status(200).json(updated);
  })
);

/**
 * Create or update a chapter (upsert) for a given story if the user owns it or is admin.
 */
storyRouter.post(
  "/:storyId/chapter",
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const chapterData = req.body;
    const storyId = parseInt(req.params.storyId, 10);

    if (!await userOwnsStory(storyId, user.id) && !(await isRequestFromAdmin(req))) {
      return res
        .status(403)
        .json({error: "You are not authorized to add chapters to this story."});
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
 * Copy a complete story (admin only).
 * Creates a full deep copy of the story (chapters, steps, images, 3D models) under the admin's account.
 */
storyRouter.post(
  "/new/:storyId/copy",
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const storyId = parseInt(req.params.storyId, 10);

    if (!(await isRequestFromAdmin(req))) {
      return res.status(403).json({error: "Only admins can copy stories."});
    }

    const original = await prismaClient.story.findFirst({
      where: {id: storyId},
      include: {
        titleImage: true,
        chapters: {
          orderBy: {sequence: "asc"},
          include: {
            StoryStep: {
              orderBy: {stepNumber: "asc"},
            },
          },
        },
      },
    });

    if (!original) {
      return res.status(404).json({error: "Story not found."});
    }

    const bucket = process.env.MINIO_BUCKET ?? "";
    const copiedMinioKeys: Array<{ key: string }> = [];

    const copyMinioFile = async (srcBucket: string, srcKey: string): Promise<string> => {
      if (!minioClient) return "";
      const destKey = `${Date.now()}-${srcKey.split("/").pop()}`;
      await minioClient.copyObject(bucket, destKey, `/${srcBucket}/${srcKey}`);
      copiedMinioKeys.push({key: destKey});
      return destKey;
    };

    let newStory: any = null;

    try {
      newStory = await prismaClient.story.create({
        data: {
          title: `${original.title} - Copy`,
          description: original.description,
          autoplayEnabled: original.autoplayEnabled,
          hideBackButton: original.hideBackButton,
          scrollytelling: original.scrollytelling,
          storyInterval: original.storyInterval,
          playerWidth: original.playerWidth,
          playerHeight: original.playerHeight,
          author: user.id,
          owner: user.id,
          isDraft: true,
        },
      });

      for (const chapter of original.chapters) {
        const newChapter = await prismaClient.chapter.create({
          data: {
            storyId: newStory.id,
            name: chapter.name,
            sequence: chapter.sequence,
          },
        });

        for (const step of chapter.StoryStep) {
          const originalModels3D = (step.models3D as any[]) ?? [];

          // Create the step first with cleared fileUrls to avoid cross-story file coupling
          const clearedModels3D = originalModels3D.map((m: any) => ({...m, fileUrl: ""}));

          const newStep = await (prismaClient.storyStep as any).create({
            data: {
              chapterId: newChapter.id,
              stepNumber: step.stepNumber,
              stepWidth: step.stepWidth,
              visible: step.visible,
              title: step.title,
              html: step.html,
              centerCoordinate: step.centerCoordinate,
              zoomLevel: step.zoomLevel,
              backgroundMapId: step.backgroundMapId,
              interactionAddons: step.interactionAddons,
              is3D: step.is3D,
              navigation3D: step.navigation3D,
              layers3D: step.layers3D,
              informationLayers: step.informationLayers,
              mapSources: step.mapSources,
              geoJsonAssets: step.geoJsonAssets,
              models3D: clearedModels3D,
            },
          });

          // Copy 3D model files and update fileUrls in the new step
          if (originalModels3D.length > 0) {
            const newModels3D = [...clearedModels3D];

            for (let i = 0; i < originalModels3D.length; i++) {
              const model = originalModels3D[i];
              if (!model.fileUrl) continue;

              // fileUrl format: "files/stories/{storyId}/steps/{stepId}/{filename}"
              const urlPath = (model.fileUrl as string).replace(/^files\//, "");
              const parts = urlPath.split("/");
              const filename = parts[parts.length - 1];
              const fileContext = parts.slice(0, -1).join("/");

              const fileRecord = await prismaClient.file.findFirst({
                where: {fileContext, filename},
              });

              if (!fileRecord) continue;

              const newFileContext = `stories/${newStory.id}/steps/${newStep.id}`;
              let newKey = "";

              if (minioClient && bucket) {
                newKey = await copyMinioFile(fileRecord.bucket, fileRecord.key);
              }

              await prismaClient.file.create({
                data: {
                  bucket: bucket || fileRecord.bucket,
                  fileContext: newFileContext,
                  filename,
                  key: newKey || fileRecord.key,
                  provider: fileRecord.provider,
                  providerMetaData:
                    fileRecord.providerMetaData === null
                      ? Prisma.JsonNull
                      : (fileRecord.providerMetaData as Prisma.InputJsonValue),
                  mimetype: fileRecord.mimetype,
                  encoding: fileRecord.encoding,
                },
              });

              newModels3D[i] = {
                ...model,
                fileUrl: `files/${newFileContext}/${filename}`,
              };
            }

            await (prismaClient.storyStep as any).update({
              where: {id: newStep.id},
              data: {models3D: newModels3D},
            });
          }
        }
      }

      // Copy title image
      if (original.titleImage && bucket) {
        const fi = original.titleImage;
        const newFileContext = `stories/${newStory.id}`;
        let newKey = fi.key;

        if (minioClient) {
          newKey = await copyMinioFile(fi.bucket, fi.key);
        }

        const newFile = await prismaClient.file.create({
          data: {
            bucket: bucket || fi.bucket,
            fileContext: newFileContext,
            filename: fi.filename,
            key: newKey,
            provider: fi.provider,
            providerMetaData:
              fi.providerMetaData === null
                ? Prisma.JsonNull
                : (fi.providerMetaData as Prisma.InputJsonValue),
            mimetype: fi.mimetype,
            encoding: fi.encoding,
          },
        });

        await prismaClient.story.update({
          where: {id: newStory.id},
          data: {titleImageId: newFile.id},
        });
      }

      return res.status(201).json({id: newStory.id});
    } catch (error) {
      logger.error("Error copying story:", error);

      // Compensating cleanup: delete the partially created story (cascade handles chapters/steps)
      if (newStory) {
        try {
          await prismaClient.story.delete({where: {id: newStory.id}});
        } catch (cleanupError) {
          logger.error("Error cleaning up new story after failed copy:", cleanupError);
        }
      }

      // Compensating cleanup: remove any copied MinIO objects
      if (minioClient && copiedMinioKeys.length > 0) {
        for (const {key} of copiedMinioKeys) {
          try {
            await minioClient.removeObject(bucket, key);
          } catch (cleanupError) {
            logger.error(`Error removing copied MinIO object ${key}:`, cleanupError);
          }
        }
      }

      return res.status(500).json({error: "Failed to copy story."});
    }
  })
);

export default storyRouter;
