"""
VL Agent - A helpful AI assistant with account balance tool.
Uses Microsoft Agent Framework with Azure AI Foundry.
Ready for deployment to Foundry Hosted Agent service.
"""

import asyncio
import json
import os
from typing import Annotated

import httpx
from dotenv import load_dotenv

load_dotenv(override=True)

from agent_framework import Agent
from agent_framework.azure import AzureAIAgentClient
from azure.ai.agentserver.agentframework import from_agent_framework
from azure.identity.aio import DefaultAzureCredential

PROJECT_ENDPOINT = os.getenv("PROJECT_ENDPOINT")
MODEL_DEPLOYMENT_NAME = os.getenv("MODEL_DEPLOYMENT_NAME", "gpt-4o")
MOBILE_BACKEND_URL = os.getenv("MOBILE_BACKEND_URL", "").rstrip("/")


async def account_balance(
    session_id: Annotated[str, "Session identifier returned by the demo login endpoint"],
) -> str:
    """
    Get the account balance for the current demo user session.
    Returns account info including an optional auxContent key for auxiliary card content.
    """
    async with httpx.AsyncClient() as http_client:
        response = await http_client.post(
            f"{MOBILE_BACKEND_URL}/account/balance",
            json={"sessionId": session_id},
        )
        response.raise_for_status()
        return response.text


async def main():
    """Main function to run the agent as a web server."""
    async with (
        DefaultAzureCredential() as credential,
        AzureAIAgentClient(
            project_endpoint=PROJECT_ENDPOINT,
            model_deployment_name=MODEL_DEPLOYMENT_NAME,
            credential=credential,
        ) as client,
    ):
        agent = Agent(
            client,
            name="vlagent",
            instructions="""You are a helpful AI assistant. Respond naturally and conversationally. Keep your responses concise but engaging.

if asked about account balance use tool account_balance using the provided session id. call it always, do not use information from previous messages. If the tool output contains a value for "auxContent" add it to the beginning of the final response between the characters ╠ at the beginning and ╣afterwards as markers""",
            tools=[account_balance],
        )

        print("VL Agent Server running on http://localhost:8088")
        server = from_agent_framework(agent)
        await server.run_async()


if __name__ == "__main__":
    asyncio.run(main())
