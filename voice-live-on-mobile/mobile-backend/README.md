# Voice Live Mobile Backend

Demo Node.js backend API for the Voice Live mobile sample apps. It intentionally uses static sample users and in-memory sessions only. It is not a production authentication or persistence implementation.

## Demo Users

Use one of these static user names with `POST /login`:

- `alex`
- `sam`
- `taylor`

## Run Locally

```bash
npm install
npm run dev
```

The API listens on `PORT` or `8080` by default.

Optional Voice Live web app configuration returned by `POST /vlapi/token`:

```bash
AZURE_VOICELIVE_ENDPOINT=https://<your-ai-foundry-or-voice-live-endpoint>
AZURE_VOICELIVE_AGENT_NAME=<agent-name>
AZURE_VOICELIVE_PROJECT_NAME=<project-name>
VOICE_LIVE_WEB_APP_URL=https://<your-static-web-app-url>
```

## API

### `POST /login`

Creates an in-memory demo session for one static user.

Request:

```json
{
  "userName": "alex"
}
```

Response:

```json
{
  "sessionId": "...",
  "userName": "alex",
  "displayName": "Alex Becker"
}
```

### `POST /account/balance`

Returns the static balance for the user associated with the session. This endpoint is described in `GET /openapi.json` and can be imported as an OpenAPI tool in Azure AI Foundry agent tooling.

Request:

```json
{
  "sessionId": "..."
}
```

Response:

```json
{
  "userName": "alex",
  "displayName": "Alex Becker",
  "accountBalance": 1420.75,
  "currency": "EUR"
}
```

### `POST /vlapi/token`

Validates the session and returns an access token acquired through `DefaultAzureCredential` for the scope `https://ai.azure.com/.default`. The response also includes the Voice Live web app configuration from environment variables.

Request:

```json
{
  "sessionId": "..."
}
```

Response:

```json
{
  "tokenType": "Bearer",
  "accessToken": "...",
  "expiresOnTimestamp": 1770000000000,
  "scope": "https://ai.azure.com/.default",
  "config": {
    "endpoint": "https://<your-ai-foundry-or-voice-live-endpoint>",
    "agentName": "<agent-name>",
    "projectName": "<project-name>",
    "webAppUrl": "https://<your-static-web-app-url>"
  }
}
```

Access tokens are secrets. This endpoint is included for demo scenarios only.

## Deploy To Azure App Service

This folder includes Azure Developer CLI configuration and Bicep infrastructure for a Linux Azure App Service with a system-assigned managed identity.

```bash
azd auth login
azd init --environment voice-live-mobile-backend
azd up
```

After deployment, grant the web app managed identity access to the Azure AI resource that should issue/accept tokens. The Bicep output `AZURE_WEBAPP_PRINCIPAL_ID` is the service principal object id for role assignments.

Set these `azd` environment values before deployment if you want the deployed token endpoint to return web app connection configuration:

```bash
azd env set AZURE_VOICELIVE_ENDPOINT "https://<your-ai-foundry-or-voice-live-endpoint>"
azd env set AZURE_VOICELIVE_AGENT_NAME "<agent-name>"
azd env set AZURE_VOICELIVE_PROJECT_NAME "<project-name>"
azd env set VOICE_LIVE_WEB_APP_URL "https://<your-static-web-app-url>"
```

The deployed app exposes:

- `GET /health`
- `GET /openapi.json`
- `POST /login`
- `POST /account/balance`
- `POST /vlapi/token`

## Notes

- Sessions are stored in memory and disappear on restart, scale-out, or deployment.
- The App Service plan is configured as Basic B1 for a simple demo. Choose a different SKU for production-like load.
- For production, replace the demo login with real identity, add persistent session storage, restrict CORS, and avoid returning raw access tokens to browsers unless the architecture explicitly requires it.
