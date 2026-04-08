import type { Prisma, PrismaClient } from "@prisma/client";

import { minioClient } from "../../utils/minio";
import { setupLogger } from "../../utils/logger.ts";

const logger = setupLogger({ label: "storyCleanup" });

function isMissingObjectError(error: unknown) {
  const candidate = error as { code?: string; message?: string } | null;
  return candidate?.code === "NoSuchKey" || candidate?.message?.includes("NoSuchKey");
}

export async function deleteStoryWithResources(
  prismaClient: PrismaClient,
  storyWhere: Prisma.StoryWhereInput,
) {
  const story = await prismaClient.story.findFirstOrThrow({
    where: storyWhere,
    select: { id: true },
  });

  const storyPrefix = `stories/${story.id}`;
  const filesToDelete = await prismaClient.file.findMany({
    where: {
      fileContext: {
        startsWith: storyPrefix,
      },
    },
    select: {
      id: true,
      bucket: true,
      key: true,
    },
  });

  if (minioClient) {
    for (const file of filesToDelete) {
      try {
        await minioClient.removeObject(file.bucket, file.key);
      }
      catch (error) {
        if (!isMissingObjectError(error)) {
          logger.error(`Failed to delete object ${file.key} from storage`, error);
          throw new Error("Failed to delete story files from storage");
        }
      }
    }
  }

  await prismaClient.$transaction(async (tx) => {
    await tx.story.delete({
      where: {
        id: story.id,
      },
    });

    if (filesToDelete.length > 0) {
      await tx.file.deleteMany({
        where: {
          id: {
            in: filesToDelete.map((file) => file.id),
          },
        },
      });
    }
  });
}
