import { type Request, type Response, type NextFunction } from "express";

const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    if (process.env.USE_AUTHENTICATION == "false") {
        req.body.user = createDevUser();
        next();
        return;
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).send("Unauthorized: No token provided");
    }

    const introspectionUrl = process.env.KEYCLOAK_URL!;

    const token = authHeader.split(" ")[1];

    try {
        const response = await fetch(introspectionUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
                client_id: process.env.KEYCLOAK_CLIENT_ID!,
                client_secret: process.env.KEYCLOAK_CLIENT_SECRET!,
                token: token
            })
        });

        const data = await response.json();

        if (data.active === false) {
            return res.status(401).send("Unauthorized: Token is not active");
        }

        req.body.user = {
            id: data.sub,
            email: data.email,
            username: data.preferred_username,
            name: data.name,
            scope: data.scope,
            roles: data.resource_access[process.env.KEYCLOAK_CLIENT_ID!].roles
        };
        next();
    } catch (err) {
        console.error(err);
        return res.status(401).send("Unauthorized: Invalid token");
    }
};

const createDevUser = () => {
    return {
        id: "69",
        email: "testuser@example.com",
        username: "testuser",
        name: "testuser",
        scope: "testuser",
        roles: "all the roles"
    }
}

export const bareboneAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).send("Unauthorized: No token provided");
    }

    const introspectionUrl = process.env.KEYCLOAK_URL!;

    const token = authHeader.split(" ")[1];

    try {
        const response = await fetch(introspectionUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
                client_id: process.env.KEYCLOAK_CLIENT_ID!,
                client_secret: process.env.KEYCLOAK_CLIENT_SECRET!,
                token: token
            })
        });

        const data = await response.json();

        if (data.active === false) {
            return res.status(401).send("Unauthorized: Token is not active");
        }

        next();
    } catch (err) {
        console.error(err);
        return res.status(401).send("Unauthorized: Invalid token");
    }
};

export default authMiddleware;
