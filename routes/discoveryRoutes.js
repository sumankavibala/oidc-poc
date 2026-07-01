import express from "express";

const router = express.Router();

router.get("/openid-configuration", (req, res) => {
    const host = req.headers.host;
    const issuerUrl = `http://${host}`;
    res.json({
    issuer: issuerUrl,

    authorization_endpoint:
        `${issuerUrl}/auth/authorize`,

    token_endpoint:
        `${issuerUrl}/auth/token`,

    userinfo_endpoint:
        `${issuerUrl}/auth/userinfo`,
    response_types_supported: [
        "code"
    ],
    grant_types_supported: [
        "authorization_code",
        "refresh_token"
    ],
    scopes_supported: [
        "openid",
        "profile"
    ],
    token_endpoint_auth_methods_supported: ["client_secret_post"],
    id_token_signing_alg_values_supported: ["RS256"],
    jwks_uri: `${issuerUrl}/.well-known/jwks.json`
});
});



export default router;