import {Router, type Request, type Response} from "express";
import {PrismaClient} from "@prisma/client";
import authMiddleware from "../middlewares/authMiddleware.ts";
import asyncHandler from "../handlers/asyncHandler.ts";

const prismaClient = new PrismaClient();


const meRouter = Router()

meRouter.get('/', authMiddleware, asyncHandler(async (request, response) => {
    return response.json({
        ...request.body.user
    });
}))

export default meRouter;

