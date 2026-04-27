# Instructions to run Microsoft Azure Voice Live with Avatar sample code
This sample demonstrates the usage of Azure Voice Live API with avatar.

### Prerequisites
- An active Azure account. If you don't have an Azure account, you can create a account [here](https://azure.microsoft.com/free/ai-services).
- A Microsoft Foundry resource created in one of the supported regions. For more information about region availability, see the [voice live overview documentation](https://learn.microsoft.com/azure/ai-services/speech-service/voice-live).
- Node.js 20 or newer.

### Avatar available locations
The avatar feature is currently available in the following service regions: Southeast Asia, North Europe, West Europe, Sweden Central, South Central US, East US 2, and West US 2.

### Build the sample
Navigate to the folder containing this README.md document:
  ```bash
  # Windows (PowerShell/Command Prompt)
  cd .\voice-live-on-mobile\voice-live-avatar\
  ```
  ```bash
  # macOS/Linux (Terminal)
  cd ./voice-live-on-mobile/voice-live-avatar/
  ```

Install dependencies and build the static SPA:
  ```bash
  npm install
  npm run build
  ```

### Start the sample
For local development, use:
  ```bash
  npm run dev
  ```

Then open your web browser and navigate to [http://localhost:3000](http://localhost:3000) to access the sample.

This mobile-hosted variant uses only the static Next.js SPA. The previous Python server and Python-based container path are no longer part of this app.

### Configure and play the sample

* Step 1: Under the `Connection Settings` section, fill `Azure AI Services Endpoint` and `Subscription Key`, which can be obtained from the `Keys and Endpoint` tab in your Azure AI Services resource. The endpoint can be the regional endpoint (e.g., `https://<region>.api.cognitive.microsoft.com/`) or a custom domain endpoint (e.g., `https://<custom-domain>.cognitiveservices.azure.com/`).

* Alternative for middleware testing: Switch `Connection Route` to `Via existing middleware` and enter the base URL of a running Voice Live middleware instance, for example the Python middleware from the `voice-live-universal-assistant` sample. In this mode, the browser no longer connects directly to Voice Live; audio and text go through the middleware instead.

* Step 2: Under `Conversation Settings` section, configure the avatar:
  - **Enable Avatar**: Toggle the `Avatar` switch to enable the avatar feature.
  - **Avatar Type**: By default, a prebuilt avatar is used. Select a character from the `Avatar` dropdown list.
    - To use a **photo avatar**, toggle the `Use Photo Avatar` switch and select a prebuilt photo avatar character from the dropdown list.
    - To use a **custom avatar**, toggle the `Use Custom Avatar` switch and enter the character name in the `Character` field.
  - **Avatar Output Mode**: Choose between `WebRTC` (default, real-time streaming) and `WebSocket` (streams video data over the WebSocket connection).
  - **Avatar Background Image URL** *(optional)*: Enter a URL to set a custom background image for the avatar.
  - **Scene Settings** *(photo avatar only)*: When using a photo avatar, adjust scene parameters such as `Zoom`, `Position X/Y`, `Rotation X/Y/Z`, and `Amplitude`. These settings can also be adjusted live after connecting.

* Middleware limitation: When `Via existing middleware` is selected, video avatar rendering is disabled on purpose. This route is intended for comparing the direct Voice Live connection with the middleware-backed audio/text flow.

* Step 3: Click `Connect` button to start the conversation. Once connected, you should see the avatar appearing on the page, and you can click `Turn on microphone` and start talking with the avatar with speech.

* Step 4: On top of the page, you can toggle the `Developer mode` switch to enable developer mode, which will show chat history in text and additional logs useful for debugging.

### Deployment

This sample is intended to be deployed as a static SPA. The prepared deployment path in this folder uses Azure Static Web Apps via `azd`.

### Deployment with azd for the static SPA

This folder includes an `azd` setup for Azure Static Web Apps.

What gets created:
- One Azure Static Web App in the existing resource group `rg-voice-live-mobile-backend`

Files prepared for this flow:
- `azure.yaml`
- `infra/main.bicep`

Run from this folder:

```bash
azd auth login
azd env new <environment-name>
azd up
```

Notes:
- The app is deployed from the static export in `out/`, produced by `npm run build`.
- The Bicep template defaults to the location of the existing resource group.
- `azd up` uses the fixed resource group `rg-voice-live-mobile-backend`, so make sure it already exists in your subscription.
