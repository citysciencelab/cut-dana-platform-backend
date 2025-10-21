import {Router, type Request, type Response} from "express";
import authMiddleware from "../middlewares/authMiddleware.ts";
import asyncHandler from "../handlers/asyncHandler.ts";
import {getAdminToken, deleteKcUser} from "../utils/keycloakAdmin.ts";

const meRouter = Router()

meRouter.get('/', authMiddleware, asyncHandler(async (request: Request, response: Response) => {
    return response.json({
        ...request.user
    });
}))

meRouter.delete('/',
    authMiddleware,
    asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user.id;
    if (!userId) return res.status(400).json({ error: "Unknown user id" });

    const adminToken = await getAdminToken();
    await deleteKcUser(userId, adminToken);

    res.status(204).send();
}))

export default meRouter;

