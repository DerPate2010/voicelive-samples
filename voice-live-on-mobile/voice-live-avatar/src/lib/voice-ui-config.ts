export interface VoiceUIMcpServerConfig {
  id: string;
  serverUrl: string;
  authorization?: string;
  serverLabel: string;
  requireApproval: boolean;
}

export interface VoiceUIFoundryAgentToolConfig {
  id: string;
  agentName: string;
  agentVersion: string;
  projectName: string;
  description?: string;
  clientId?: string;
}

export interface VoiceUIConnectionConfig {
  apiKey: string;
  endpoint: string;
  entraToken: string;
  authType: "apiKey" | "entraToken";
  model: string;
  searchEndpoint: string;
  searchApiKey: string;
  searchIndex: string;
  searchContentField: string;
  searchIdentifierField: string;
  recognitionLanguage: string;
  srModel:
    | "azure-speech"
    | "mai-transcribe-1"
    | "gpt-4o-transcribe"
    | "gpt-4o-mini-transcribe"
    | "gpt-4o-transcribe-diarize";
  phraseList: string[];
  customSpeechModels: Record<string, string>;
  useNS: boolean;
  useEC: boolean;
  turnDetectionType: { type: string; [key: string]: unknown } | null;
  eouDetectionType: string;
  instructions: string;
  enableProactive: boolean;
  temperature: number;
  voiceTemperature: number;
  voiceSpeed: number;
  voiceType:
    | "standard"
    | "custom"
    | "personal"
    | "azure-realtime-native"
    | "avatar-voice-sync";
  avatarVoiceSyncModel:
    | "DragonLatestNeural"
    | "DragonHDOmniLatestNeural"
    | "mai-voice-1";
  voiceName: string;
  customVoiceName: string;
  personalVoiceName: string;
  personalVoiceModel:
    | "DragonLatestNeural"
    | "DragonHDOmniLatestNeural"
    | "mai-voice-1";
  avatarName: string;
  photoAvatarName: string;
  customAvatarName: string;
  avatarBackgroundImageUrl: string;
  voiceDeploymentId: string;
  tools: Array<Record<string, unknown>>;
  mcpServers: VoiceUIMcpServerConfig[];
  foundryAgentTools: VoiceUIFoundryAgentToolConfig[];
  isAvatar: boolean;
  isPhotoAvatar: boolean;
  isCustomAvatar: boolean;
  avatarOutputMode: "webrtc" | "websocket";
  sceneZoom: number;
  scenePositionX: number;
  scenePositionY: number;
  sceneRotationX: number;
  sceneRotationY: number;
  sceneRotationZ: number;
  sceneAmplitude: number;
  mode: "model" | "agent";
  agentProjectName: string;
  agentName: string;
  agentVersion: string;
  interimResponseEnabled: boolean;
  interimResponseType: "static_interim_response" | "llm_interim_response";
  interimResponseTriggers: Array<"latency" | "tool">;
  interimResponseLatencyThreshold: number;
  interimResponseTexts: string;
  interimResponseModel: string;
  interimResponseInstructions: string;
  interimResponseMaxTokens: number;
}

declare global {
  interface Window {
    connectVoiceLiveAvatar?: (
      config: Partial<VoiceUIConnectionConfig>
    ) => Promise<void>;
    disconnectVoiceLiveAvatar?: () => Promise<void>;
  }
}

export {};