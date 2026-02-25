# Known Issues — C# Backend (Azure.AI.VoiceLive 1.1.0-beta.2)

## Interim Response Not Supported

`VoiceLiveSessionOptions` does not expose an `InterimResponse` property in this SDK version. The underlying types (`LlmInterimResponseConfig`, `StaticInterimResponseConfig`) are public but not wired to the session options.

**Impact:** Interim response settings from the frontend are silently ignored.

**Workaround:** Disable interim response in the frontend settings panel when using the C# backend. This will be resolved when a future SDK version exposes `InterimResponse` on `VoiceLiveSessionOptions`.
