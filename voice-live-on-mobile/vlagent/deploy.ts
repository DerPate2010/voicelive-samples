import { DefaultAzureCredential } from "@azure/identity";
import { AIProjectClient } from "@azure/ai-projects";
import * as fs from "node:fs";
import * as path from "node:path";
import * as dotenv from "dotenv";

// Load .env from parent hosted-agent2 folder (contains PROJECT_ENDPOINT)
dotenv.config({ path: path.resolve(__dirname, "../hosted-agent2/.env") });

const PROJECT_ENDPOINT = process.env.PROJECT_ENDPOINT;
const MODEL_DEPLOYMENT_NAME = process.env.MODEL_DEPLOYMENT_NAME ?? "gpt-4o";
const AGENT_NAME = "vlagent";

if (!PROJECT_ENDPOINT) {
    throw new Error(
        "PROJECT_ENDPOINT is not set. Add it to ../hosted-agent2/.env or set it as an environment variable."
    );
}

// OpenAPI spec for the account_balance backend tool
const accountBalanceSpec = {
    openapi: "3.0.3",
    info: {
        title: "Voice Live Mobile Demo Backend",
        version: "0.1.0",
        description:
            "Demo backend for Voice Live mobile samples. Data is static and sessions are in-memory only.",
    },
    servers: [
        { url: "https://app-voice-live-mobile-backend-4mlyqpwfzauts.azurewebsites.net" },
    ],
    paths: {
        "/account/balance": {
            post: {
                operationId: "getAccountBalance",
                summary: "Get the account balance for the current demo user session.",
                description:
                    "Returns a static account balance for one of the demo users. Pass the sessionId returned by /login.",
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
                                        auxContent: {
                                            type: "string",
                                            description:
                                                "Optional key for auxiliary JSON content delivered over a separate channel.",
                                        },
                                    },
                                },
                            },
                        },
                    },
                    "401": { description: "Invalid or missing session." },
                },
            },
        },
        "/aux-content/{key}": {
            get: {
                operationId: "getAuxContent",
                summary: "Get auxiliary JSON content for a previously returned auxContent key.",
                parameters: [
                    { name: "key", in: "path", required: true, schema: { type: "string" } },
                ],
                responses: {
                    "200": {
                        description: "The auxiliary JSON payload for the requested key.",
                        content: {
                            "application/json": {
                                schema: { type: "object", additionalProperties: true },
                            },
                        },
                    },
                    "404": { description: "Unknown auxiliary content key." },
                },
            },
        },
    },
};

async function main(): Promise<void> {
    const project = new AIProjectClient(PROJECT_ENDPOINT!, new DefaultAzureCredential());

    var agent28 = await project.agents.getVersion(AGENT_NAME, "28");

    const agent = await project.agents.createVersion(AGENT_NAME, {
        kind: "prompt",
        model: MODEL_DEPLOYMENT_NAME,
        instructions: `You are a helpful AI assistant. Respond naturally and conversationally. Keep your responses concise but engaging.

if asked about account balance use tool account_balance using the provided session id. call it always, do not use information from previous messages
If the account_balance tool output contains a value for "auxContent" call the ShowCard tool with the content of "auxContent" as the payload`,
        tools: [
            {
                type: "openapi",
                openapi: {
                    name: "account_balance",
                    description: "Provides optional card content for the client",
                    spec: accountBalanceSpec,
                    auth: { type: "anonymous" },
                },
            },
            {
                type: "function",
                name: "ShowCard",
                description: "show structured data in the client",
                parameters: {
                    type: "object",
                    required: ["payload"],
                    properties: {
                        payload: {
                            type: "string",
                            description: "content to be displayed",
                        },
                    },
                    additionalProperties: false,
                },
            },
        ],
    } as any);

    console.log(`Agent version created:`);
    console.log(`  id:      ${agent.id}`);
    console.log(`  name:    ${agent.name}`);
    console.log(`  version: ${agent.version}`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
