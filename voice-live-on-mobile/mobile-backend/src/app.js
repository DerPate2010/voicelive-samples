import express from "express";
import { randomUUID } from "node:crypto";
import { DefaultAzureCredential } from "@azure/identity";

const PORT = Number.parseInt(process.env.PORT || "8080", 10);
const VLAPI_SCOPE = "https://ai.azure.com/.default";
const normalizeEnvString = (value) => String(value || "").trim();
const vlapiConfig = {
  endpoint: normalizeEnvString(process.env.AZURE_VOICELIVE_ENDPOINT),
  agentName: normalizeEnvString(process.env.AZURE_VOICELIVE_AGENT_NAME),
  projectName: normalizeEnvString(process.env.AZURE_VOICELIVE_PROJECT_NAME || process.env.AZURE_VOICELIVE_PROJECT),
  webAppUrl: normalizeEnvString(process.env.VOICE_LIVE_WEB_APP_URL),
};

const users = new Map([
  ["alex", { displayName: "Alex Becker", accountBalance: 1420.75, currency: "EUR" }],
  ["sam", { displayName: "Sam Weber", accountBalance: 238.4, currency: "EUR" }],
  ["taylor", { displayName: "Taylor Klein", accountBalance: 9830.12, currency: "EUR" }],
]);

const sessions = new Map();
const credential = new DefaultAzureCredential(
  process.env.AZURE_CLIENT_ID
    ? { managedIdentityClientId: process.env.AZURE_CLIENT_ID }
    : undefined,
);

const app = express();
app.use(express.json({ limit: "64kb" }));

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type,Authorization,x-session-id");
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

function readSessionId(req) {
  return req.body?.sessionId || req.query?.sessionId || req.header("x-session-id") || "";
}

function getSession(req, res) {
  const sessionId = readSessionId(req);
  const session = sessions.get(sessionId);
  if (!session) {
    res.status(401).json({ error: "invalid_session", message: "The sessionId is missing or invalid." });
    return null;
  }
  return session;
}

function getBaseUrl(req) {
  return `${req.protocol}://${req.get("host")}`;
}

function getMissingVoiceLiveConfig() {
  return Object.entries(vlapiConfig)
    .filter(([, value]) => !value)
    .map(([key]) => key);
}

function buildOpenApiDocument(req) {
  const baseUrl = getBaseUrl(req);
  return {
    openapi: "3.0.3",
    info: {
      title: "Voice Live Mobile Demo Backend",
      version: "0.1.0",
      description: "Demo backend for Voice Live mobile samples. Data is static and sessions are in-memory only.",
    },
    servers: [{ url: baseUrl }],
    paths: {
      "/account/balance": {
        post: {
          operationId: "getAccountBalance",
          summary: "Get the account balance for the current demo user session.",
          description: "Returns a static account balance for one of the demo users. Pass the sessionId returned by /login.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["sessionId"],
                  properties: {
                    sessionId: {
                      type: "string",
                      description: "Session identifier returned by the demo login endpoint.",
                    },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "The account balance for the current demo user.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["userName", "displayName", "accountBalance", "currency"],
                    properties: {
                      userName: { type: "string" },
                      displayName: { type: "string" },
                      accountBalance: { type: "number" },
                      currency: { type: "string" },
                    },
                  },
                },
              },
            },
            "401": { description: "Invalid or missing session." },
          },
        },
      },
    },
  };
}

app.get("/", (_req, res) => {
  res.json({
    service: "voice-live-mobile-backend",
    version: "0.1.0",
    users: [...users.keys()],
    endpoints: ["POST /login", "POST /account/balance", "POST /vlapi/token", "GET /openapi.json", "GET /health"],
  });
});

app.get("/health", (_req, res) => {
  res.json({ status: "healthy", sessions: sessions.size });
});

app.get("/openapi.json", (req, res) => {
  res.json(buildOpenApiDocument(req));
});

app.post("/login", (req, res) => {
  const userName = String(req.body?.userName || "").trim().toLowerCase();
  const user = users.get(userName);
  if (!user) {
    res.status(400).json({
      error: "unknown_user",
      message: "Use one of the static demo users.",
      allowedUsers: [...users.keys()],
    });
    return;
  }

  const sessionId = randomUUID();
  sessions.set(sessionId, {
    userName,
    createdAt: new Date().toISOString(),
  });

  res.json({
    sessionId,
    userName,
    displayName: user.displayName,
  });
});

app.post("/account/balance", (req, res) => {
  const session = getSession(req, res);
  if (!session) return;

  const user = users.get(session.userName);
  res.json({
    userName: session.userName,
    displayName: user.displayName,
    accountBalance: user.accountBalance,
    currency: user.currency,
  });
});

app.post("/vlapi/token", async (req, res) => {
  const session = getSession(req, res);
  if (!session) return;

  try {
    const missingConfig = getMissingVoiceLiveConfig();
    if (missingConfig.length > 0) {
      throw new Error(`Missing Voice Live configuration: ${missingConfig.join(", ")}`);
    }

    const accessToken = await credential.getToken(VLAPI_SCOPE);
    if (!accessToken?.token) {
      throw new Error("DefaultAzureCredential returned no token.");
    }

    res.json({
      tokenType: "Bearer",
      accessToken: accessToken.token,
      expiresOnTimestamp: accessToken.expiresOnTimestamp,
      scope: VLAPI_SCOPE,
      config: vlapiConfig,
    });
  } catch (error) {
    console.error("Failed to acquire VLAPI token:", error);
    res.status(500).json({
      error: "token_acquisition_failed",
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

app.listen(PORT, () => {
  console.log(`Voice Live mobile backend listening on port ${PORT}`);
});
