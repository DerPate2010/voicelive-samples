# Voice Live Mobile Foundry Agent

This folder contains the Azure AI Foundry prompt agent definition used by the `voice-live-on-mobile` solution.

## Files

- `agent.yaml`: Foundry agent version definition for `vlagent` version `26`
- `Avatar_Default.svg`: local logo asset referenced by the agent metadata

## Purpose

This agent is intended to be used together with:

- `mobile-backend` for the OpenAPI tool endpoints
- `voice-live-avatar` as the SPA client
- `host-android` and `host-ios` as the mobile WebView hosts

The agent instruction contract expects account-balance calls to always use the provided session id and, when the backend returns `auxContent`, to prepend that key to the response between `╠` and `╣`.

## Backend linkage

The OpenAPI tool in `agent.yaml` points to:

- `https://app-voice-live-mobile-backend-4mlyqpwfzauts.azurewebsites.net`

If that backend URL changes, update the `servers` section in `agent.yaml` before importing or publishing a new agent version.
