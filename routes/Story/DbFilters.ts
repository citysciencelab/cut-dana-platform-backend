import { PrismaClient } from "@prisma/client"

export const OwnedStory = (userId: string) => {
    return {
        owner: userId
    }
}

export const OwnedOrPublishedStory = (userId: string) => {
    return {
        OR: [
            OwnedStory(userId),
            {
                isDraft: false
            },
        ]
    }
}

export const userOwnsStory = async (storyId: number, userId: string) => {
    const prismaClient = new PrismaClient(); // is this a bad idea? creating new client every time
    const story = await prismaClient.story.findUnique({
        where: { id: storyId },
        select: { owner: true },
    });

    return (story && story.owner == userId)
}