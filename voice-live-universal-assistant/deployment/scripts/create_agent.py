"""
Create a Foundry Agent with Voice Live configuration stored as metadata.
Requires environment variables: PROJECT_ENDPOINT, AGENT_NAME, MODEL_DEPLOYMENT_NAME.
"""
import os
import json
import sys

from azure.identity import DefaultAzureCredential
from azure.ai.projects import AIProjectClient
from azure.ai.projects.models import PromptAgentDefinition


def chunk_config(config_json: str, limit: int = 512) -> dict:
    """Split config into chunked metadata entries (512-char metadata limit per key)."""
    metadata = {"microsoft.voice-live.configuration": config_json[:limit]}
    remaining = config_json[limit:]
    chunk_num = 1
    while remaining:
        metadata[f"microsoft.voice-live.configuration.{chunk_num}"] = remaining[:limit]
        remaining = remaining[limit:]
        chunk_num += 1
    return metadata


def reassemble_config(metadata: dict) -> str:
    """Reassemble chunked Voice Live configuration."""
    config = metadata.get("microsoft.voice-live.configuration", "")
    chunk_num = 1
    while f"microsoft.voice-live.configuration.{chunk_num}" in metadata:
        config += metadata[f"microsoft.voice-live.configuration.{chunk_num}"]
        chunk_num += 1
    return config


def main() -> None:
    project_endpoint = os.environ.get("PROJECT_ENDPOINT")
    agent_name = os.environ.get("AGENT_NAME", "voicelive-assistant")
    model_deployment = os.environ.get("MODEL_DEPLOYMENT_NAME", "gpt-4.1-mini")

    if not project_endpoint:
        print("ERROR: PROJECT_ENDPOINT environment variable is required.")
        sys.exit(1)

    # Voice Live session settings
    voice_live_config = {
        "session": {
            "voice": {
                "name": "en-US-Ava:DragonHDLatestNeural",
                "type": "azure-standard",
                "temperature": 0.8,
            },
            "input_audio_transcription": {"model": "azure-speech"},
            "turn_detection": {
                "type": "azure_semantic_vad",
                "end_of_utterance_detection": {
                    "model": "semantic_detection_v1_multilingual"
                },
            },
            "input_audio_noise_reduction": {"type": "azure_deep_noise_suppression"},
            "input_audio_echo_cancellation": {"type": "server_echo_cancellation"},
        }
    }

    project_client = AIProjectClient(
        endpoint=project_endpoint,
        credential=DefaultAzureCredential(),
    )

    print(f"Creating agent '{agent_name}' with model '{model_deployment}'...")

    agent = project_client.agents.create_version(
        agent_name=agent_name,
        definition=PromptAgentDefinition(
            model=model_deployment,
            instructions="You are a helpful assistant that answers general questions.",
        ),
        metadata=chunk_config(json.dumps(voice_live_config)),
    )
    print(f"  OK: Agent created: {agent.name} (version {agent.version})")

    # Verify configuration was stored correctly
    retrieved_agent = project_client.agents.get(agent_name=agent_name)
    stored_metadata = (
        (retrieved_agent.versions or {}).get("latest", {}).get("metadata", {})
    )
    stored_config = reassemble_config(stored_metadata)

    if stored_config:
        parsed = json.loads(stored_config)
        print(f"  OK: Voice Live config verified ({len(stored_config)} chars)")
        print(f"    Voice: {parsed['session']['voice']['name']}")
        print(f"    VAD: {parsed['session']['turn_detection']['type']}")
    else:
        print("  WARNING: Voice Live configuration not found in agent metadata.")
        sys.exit(1)


if __name__ == "__main__":
    main()
