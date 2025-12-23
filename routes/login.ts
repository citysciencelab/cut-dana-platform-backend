import { Router, type Request, type Response } from "express";
import { PrismaClient } from "@prisma/client";
import asyncHandler from "../handlers/asyncHandler.ts";

const prismaClient = new PrismaClient();

const authRouter = Router()

authRouter.get('/config', asyncHandler(async (request: Request, response: Response) => {
    const loginConfig = await prismaClient.keycloakSetup.findFirst();

    if (!loginConfig) {
        return response.status(401).send("Not Found");
    }

    return response.json({
        ...loginConfig
    });
}))

export default authRouter;
