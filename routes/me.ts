import {Router, type Request, type Response} from "express";
import {PrismaClient} from "@prisma/client";
import authMiddleware from "../middlewares/authMiddleware.ts";

const prismaClient = new PrismaClient();


const meRouter = Router()

meRouter.get('/', authMiddleware, async (request, response) => {
    return response.json({
        ...request.body.user
    });
})

export default meRouter;

