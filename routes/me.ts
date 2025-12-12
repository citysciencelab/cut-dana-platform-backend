import {Router, type Request, type Response} from "express";
import authMiddleware from "../middlewares/authMiddleware.ts";
import asyncHandler from "../handlers/asyncHandler.ts";
import {getAdminToken, deleteKcUser} from "../utils/keycloakAdmin.ts";
import {OwnedStory} from "./Story/DbFilters.ts";
import {PrismaClient} from "@prisma/client";

const prismaClient = new PrismaClient();
const meRouter = Router()

meRouter.get('/', authMiddleware, asyncHandler(async (request: Request, response: Response) => {
    return response.json({
        ...request.user
    });
}))

meRouter.delete('/',
    authMiddleware,
    asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) return res.status(400).json({ error: "Unknown user id" });

    if (userId === "69") {
        return res.status(403).json({
            error: "Deletion of dev user is not allowed"
        });
    }

    const adminToken = await getAdminToken();

    await deleteKcUser(userId, adminToken);

    await prismaClient.story.deleteMany({
      where: {
        ...OwnedStory(userId)
      }
    });

    // TODO Delete files owned by the user from db and minIO

    res.status(204).send();
}))

export default meRouter;

