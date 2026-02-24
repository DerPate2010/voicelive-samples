# Known Issues — C# Backend (Azure.AI.VoiceLive 1.1.0-beta.2)

This document tracks known gaps and workarounds in the C# backend implementation.

## 1. Interim Response Not Supported (High)

**Issue:** `VoiceLiveSessionOptions` does not expose an `InterimResponse` property in SDK version 1.1.0-beta.2. The underlying types (`LlmInterimResponseConfig`, `StaticInterimResponseConfig`, `InterimResponseTrigger`) are public, but they are not wired to the session options.

**Impact:** Interim response settings from the frontend are silently ignored. Attempts to inject interim response via `SendCommandAsync` with a `session.update` delta cause session corruption — the agent stops receiving user audio input.

**Workaround:** The C# backend logs a warning when interim response is enabled in the frontend but does not send the configuration. Users should disable interim response in the settings panel when using the C# backend. This will be resolved when a future SDK version exposes `InterimResponse` as a strongly-typed property on `VoiceLiveSessionOptions`.

## 2. Text Model Mode — No Response After Greeting (High)

**Issue:** When using cascaded text models (e.g., `gpt-4o`, `gpt-4o-mini`) in model mode, the agent delivers the greeting but then stops responding to user input.

**Impact:** Model mode is only functional with realtime models (`gpt-4o-realtime-preview`, `gpt-4o-mini-realtime-preview`). Text/cascaded models connect and greet but do not process subsequent user audio.

**Workaround:** Use realtime models in model mode. For text model workflows, use agent mode (which delegates model selection to the Azure AI Foundry agent).

## 3. Transcription Model Auto-Correction

**Issue:** Cascaded text models require `azure-speech` as the transcription model, but the frontend may send `gpt-4o-transcribe`.

**Impact:** If left uncorrected, the service returns: *"Only 'azure-speech' and 'mai-ears-1' are supported in cascaded pipelines."*

**Workaround:** The backend auto-corrects `transcribeModel` to `azure-speech` for non-realtime models. No user action needed — this is handled transparently.
