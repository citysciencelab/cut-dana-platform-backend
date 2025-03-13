import { type Request, type Response, type NextFunction } from "express";

/**
 * Creates a mock user for local development if authentication is disabled.
 */
function createDevUser() {
  return {
    id: "69",
    email: "testuser@example.com",
    username: "testuser",
    name: "testuser",
    scope: "testuser",
    roles: "all the roles",
  };
}

/**
 * Extracts the token from the Bearer scheme in the Authorization header.
 * Returns null if no valid Bearer token is found.
 */
function getTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.split(" ")[1];
}

/**
 * Uses the Keycloak introspection endpoint to validate the token.
 * Returns user details if valid, otherwise null.
 */
async function introspectToken(token: string): Promise<any | null> {
  const introspectionUrl = process.env.KEYCLOAK_URL!;
  try {
    const response = await fetch(introspectionUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.KEYCLOAK_CLIENT_ID!,
        client_secret: process.env.KEYCLOAK_CLIENT_SECRET!,
        token,
      }),
    });
    const data = await response.json();

    // Return the entire data if active, otherwise null
    return data.active ? data : null;
  } catch (err) {
    console.error("Token introspection error:", err);
    return null;
  }
}

/**
 * Builds a user object from Keycloak introspection response data.
 */
function buildUserObject(data: any) {
  return {
    id: data.sub,
    email: data.email,
    username: data.preferred_username,
    name: data.name,
    scope: data.scope,
    roles: data.resource_access?.[process.env.KEYCLOAK_FRONTEND_CLIENT_ID!]?.roles,
  };
}

/**
 * Enforces authentication and attaches user information if valid.
 * If USE_AUTHENTICATION is "false", a dev user is attached automatically.
 * Otherwise, rejects if no valid token is provided.
 */
export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  if (process.env.USE_AUTHENTICATION === "false") {
    req.body.user = createDevUser();
    return next();
  }

  const token = getTokenFromHeader(req.headers.authorization);
  if (!token) {
    res.status(401).send("Unauthorized: No token provided");
    return;
  }

  const data = await introspectToken(token);
  if (!data) {
    res.status(401).send("Unauthorized: Token is not active");
    return;
  }

  req.body.user = buildUserObject(data);
  next();
}

/**
 * Barebone Auth: strictly requires a valid token, attaches no user data.
 */
export async function bareboneAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = getTokenFromHeader(req.headers.authorization);
  if (!token) {
    return res.status(401).send("Unauthorized: No token provided");
  }

  const data = await introspectToken(token);
  if (!data) {
    return res.status(401).send("Unauthorized: Token is not active");
  }

  next();
}

/**
 * Optional Auth: attaches user info if a valid token is present, but does not require it.
 * If USE_AUTHENTICATION is "false", a dev user is attached.
 */
export async function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  if (process.env.USE_AUTHENTICATION === "false") {
    req.body.user = createDevUser();
    return next();
  }

  const token = getTokenFromHeader(req.headers.authorization);
  // If no token, simply proceed without attaching user
  if (!token) {
    return next();
  }

  const data = await introspectToken(token);
  if (data) {
    req.body.user = buildUserObject(data);
  }

  // Proceed whether token is valid or not
  next();
}

export default authMiddleware;
