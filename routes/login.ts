import express, {Router, type Request, type Response} from "express";
import {PrismaClient} from "@prisma/client";

const prismaClient = new PrismaClient();


const authRouter = Router()

authRouter.get('/login', async (request: Request, response: Response) => {
    const loginConfig = await prismaClient.keycloakSetup.findFirst();

    if (!loginConfig) {
        return response.status(401).send("Not Found");
    }

    const redirectUrl = loginConfig.authUri

    const searchParams = new URLSearchParams();

    searchParams.set("client_id", loginConfig.clientId);
    searchParams.set("redirect_uri", loginConfig.redirectUri);
    searchParams.set("scope", loginConfig.scope);
    searchParams.set("response_type", "code");

    const url = `${redirectUrl}?${searchParams.toString()}`;

    return response.redirect(url);
})

authRouter.post('/auth', async (request: Request, response: Response) => {
    const loginConfig = await prismaClient.keycloakSetup.findFirst();

    if (!loginConfig) {
        return response.status(401).send("Not Found");
    }

    const redirectUrl = loginConfig.authUri

    const searchParams = new URLSearchParams();

    searchParams.set("client_id", loginConfig.clientId);
    searchParams.set("redirect_uri", loginConfig.redirectUri);
    searchParams.set("scope", loginConfig.scope);
    searchParams.set("response_type", "code");

    const url = `${redirectUrl}?${searchParams.toString()}`;

    return response.redirect(url);
})

authRouter.get('/config', async (request: Request, response: Response) => {
    const loginConfig = await prismaClient.keycloakSetup.findFirst();

    if (!loginConfig) {
        return response.status(401).send("Not Found");
    }

    return response.json({
        ...loginConfig
    });
})

export default authRouter;

