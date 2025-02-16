import {Router, type Request, type Response} from "express";
import {PrismaClient} from "@prisma/client";
import authMiddleware from "../middlewares/authMiddleware.ts";

const prismaClient = new PrismaClient();


const userRouter = Router()

userRouter.get('/:id', async (request, response) => {
    const introspectionUrl = `https://keycloak.datanarrator.city/admin/realms/elie-dana/users/${request.params.id}`;
    console.log("GET /users/:id", request.params.id, introspectionUrl);

    try {

        const url = "https://keycloak.datanarrator.city/realms/elie-dana/protocol/openid-connect/token";
        const params = new URLSearchParams({
            grant_type: "client_credentials",
            client_id: "elie-dana-backend",
            client_secret: "xuIy9uNNT9ITiLnvfQhiLXFhmYlQkhQZ"
        });

        const r = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: params
        });
        const rJson = await r.json();
        console.log("RJSON", rJson);
        const re = await fetch(introspectionUrl, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${rJson.access_token}`
            },
        });

        const data = await re.json();
        return response.json(data);
    } catch (err) {
        console.error(err);
        return response.status(500).send("Something went wrong");
    }
})

export default userRouter;

