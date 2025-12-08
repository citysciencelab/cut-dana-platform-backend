const {
    KEYCLOAK_BASE_URL,
    KEYCLOAK_REALM,
    KEYCLOAK_CLIENT_ID,
    KEYCLOAK_CLIENT_SECRET,
} = process.env;

export async function getAdminToken() {
    const res = await fetch(
        `${KEYCLOAK_BASE_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`,
        {
            method: "POST",
            headers: {"Content-Type": "application/x-www-form-urlencoded"},
            body: new URLSearchParams({
                grant_type: "client_credentials",
                client_id: KEYCLOAK_CLIENT_ID!,
                client_secret: KEYCLOAK_CLIENT_SECRET!,
            }),
        }
    );

    if (!res.ok) {
        const body = await res.text();
        throw new Error(`KC token ${res.status}: ${body}`);
    }

    return (await res.json()).access_token as string;
}

export async function deleteKcUser(userId: string, adminToken: string) {
    const res = await fetch(
        `${KEYCLOAK_BASE_URL}/admin/realms/${KEYCLOAK_REALM}/users/${userId}`,
        {method: "DELETE", headers: {Authorization: `Bearer ${adminToken}`}}
    );

    if (!res.ok && res.status !== 404) {
        const body = await res.text();
        throw new Error(`KC delete ${res.status}: ${body}`);
    }
}
