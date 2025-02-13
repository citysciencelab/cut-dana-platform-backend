import { type Request, type Response, type NextFunction } from "express";

const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).send("Unauthorized: No token provided");
    }

    const introspectionUrl = `https://keycloak.jorenv.eu/realms/elie-dana/protocol/openid-connect/token/introspect`;

    const token = authHeader.split(" ")[1];

    try {
        const response =await fetch(introspectionUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
                client_id: "elie-dana-backend",
                client_secret: "RIkbaqr4BbOot1hPmNGv6Fbn6slriIFM",
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
            roles: data.resource_access["elie-dana-client"].roles
        };
        next();
    } catch (err) {
        console.error(err);
        return res.status(401).send("Unauthorized: Invalid token");
    }
};

export default authMiddleware;