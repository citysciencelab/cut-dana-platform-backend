import {PrismaClient} from "@prisma/client"
import {type User, userIsAdmin} from "../../types/User.ts";

export const OwnedStory = (userId: string) => {
  return {
    owner: userId
  }
}

export const PublishedStory = {isDraft: false}


export const OwnedOrPublishedStory = (userId?: string) => {
  if (!userId) return PublishedStory;
  return {
    OR: [
      OwnedStory(userId),
      PublishedStory,
    ]
  }
}

export const userOwnsStory = async (storyId: number, userId: string) => {
  const prismaClient = new PrismaClient(); // is this a bad idea? creating new client every time
  const story = await prismaClient.story.findUnique({
    where: {id: storyId},
    select: {owner: true},
  });

  return (story && story.owner == userId)
}

export const userIsOwnerOrAdmin = async (storyId: number, user: User) => {
  return userIsAdmin(user) || await userOwnsStory(storyId, user.id)
}