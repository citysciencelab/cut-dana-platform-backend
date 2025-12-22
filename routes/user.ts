import {Router, type Request, type Response} from "express";
import asyncHandler from "../handlers/asyncHandler.ts";
import authMiddleware from '../middlewares/authMiddleware.ts';
import { deleteKcUser, getAdminToken, getKcUserById } from '../utils/keycloakAdmin.ts';
import { OwnedStory } from './Story/DbFilters.ts';
import meRouter from './me.ts';

const userRouter = Router()

userRouter.get('/:uuid',
    asyncHandler(async (req: Request, res: Response) => {
        const uuid = req.params?.uuid;

        if (!uuid){
            return res.status(400).json({ error: "Unknown user id" });
        }

        const adminToken = await getAdminToken();

        const user = await getKcUserById(uuid, adminToken);

        if (!user){
            return res.status(404).json({ error: "User could not be found in keycloak" });
        }

        return res.status(200).json({
            email: user.email,
            username: user.username
        });
    })
);
export default userRouter;

