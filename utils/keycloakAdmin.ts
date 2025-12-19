const {
    KEYCLOAK_URL,
    KEYCLOAK_REALM,
    KEYCLOAK_CLIENT_ID,
    KEYCLOAK_CLIENT_SECRET,
} = process.env;

export function getKeycloakUrl() {
    if (!KEYCLOAK_URL) throw new Error("KEYCLOAK_URL is not available");

    return `${KEYCLOAK_URL.endsWith('/') ? KEYCLOAK_URL.slice(0, -1) : KEYCLOAK_URL}`;
}

export function getKeycloakRealm() {
    if (!KEYCLOAK_REALM) throw new Error("KEYCLOAK_REALM is not available");

    return KEYCLOAK_REALM;
}

export function getKeycloakClientId() {
    if (!KEYCLOAK_CLIENT_ID) throw new Error("KEYCLOAK_CLIENT_ID is not available");

    return KEYCLOAK_CLIENT_ID;
}

export function getKeycloakClientSecret() {
    if (!KEYCLOAK_CLIENT_SECRET) throw new Error("KEYCLOAK_CLIENT_SECRET is not available");

    return KEYCLOAK_CLIENT_SECRET;
}

export async function getAdminToken() {
    console.log(`Attempting to get admin token from Keycloak at ${getKeycloakUrl()}/realms/${getKeycloakRealm()}`);

    const res = await fetch(
        `${getKeycloakUrl()}/realms/${getKeycloakRealm()}/protocol/openid-connect/token`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
                grant_type: "client_credentials",
                client_id: getKeycloakClientId(),
                client_secret: getKeycloakClientSecret()
            })
        }
    );

    if (!res.ok) {
        const body = await res.text();
        throw new Error(`Error while requesting KC token ${res.status}: ${body}`);
    }

    return (await res.json()).access_token as string;
}

export async function deleteKcUser(userId: string, adminToken: string) {
    console.log(`Attempting to delete Keycloak user with ID: ${userId}`);

    const res = await fetch(
        `${getKeycloakUrl()}/admin/realms/${getKeycloakRealm()}/users/${userId}`,
        {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${adminToken}`
            }
        }
    );

    if (!res.ok) {
        const body = await res.text();
        throw new Error(`Error while deleting a user ${res.status}: ${body}`);
    }

    console.log(`Successfully deleted Keycloak user with ID: ${userId}`);
}

export async function getKcUserById(userId: string, adminToken: string) {
    console.log(`Attempting to get Keycloak user with ID: ${userId}`);

    const res = await fetch(
        `${getKeycloakUrl()}/admin/realms/${getKeycloakRealm()}/users/${userId}`,
        {
            method: "GET",
            headers: {
                Authorization: `Bearer ${adminToken}`
            }
        }
    );

    if (!res.ok) {
        const body = await res.text();
        throw new Error(`Error while getting a user ${res.status}: ${body}`);
    }

    const user = await res.json();
    console.log(`Successfully retrieved Keycloak user with ID: ${userId}`);
    return user;
}
