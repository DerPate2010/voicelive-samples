"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import ChatInterface from "../chat-interface";
import type { VoiceUIConnectionConfig } from "@/lib/voice-ui-config";

const STORAGE_KEY = "voice-live-avatar2-test-host-config";

function readSavedConfig(): {
  config: Partial<VoiceUIConnectionConfig> | undefined;
  serialized: string | null;
} {
  if (typeof window === "undefined") {
    return { config: undefined, serialized: null };
  }

  try {
    const rawConfig = window.localStorage.getItem(STORAGE_KEY);
    if (!rawConfig) {
      return { config: undefined, serialized: null };
    }

    return {
      config: JSON.parse(rawConfig) as Partial<VoiceUIConnectionConfig>,
      serialized: rawConfig,
    };
  } catch (error) {
    console.error("Failed to read test host config from localStorage:", error);
    return { config: undefined, serialized: null };
  }
}

type VoiceIframeWindow = Window & {
  connectVoiceLiveAvatar?: (
    config: Partial<VoiceUIConnectionConfig>
  ) => Promise<void>;
  disconnectVoiceLiveAvatar?: () => Promise<void>;
};

export default function VoiceUiTestPage() {
  const initialSavedData = readSavedConfig();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [frameReady, setFrameReady] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedConfig, setSavedConfig] = useState<
    Partial<VoiceUIConnectionConfig> | undefined
  >(initialSavedData.config);
  const [savedConfigJson, setSavedConfigJson] = useState<string | null>(
    initialSavedData.serialized
  );

  const handleConfigChange = useCallback((config: VoiceUIConnectionConfig) => {
    const serializedConfig = JSON.stringify(config);
    if (savedConfigJson === serializedConfig) {
      return;
    }

    setSavedConfigJson(serializedConfig);
    setSavedConfig(config);
    try {
      window.localStorage.setItem(STORAGE_KEY, serializedConfig);
    } catch (error) {
      console.error("Failed to store test host config in localStorage:", error);
    }
  }, [savedConfigJson]);

  const getFrameWindow = () => {
    return iframeRef.current?.contentWindow as VoiceIframeWindow | null;
  };

  const connectIframe = async (config: VoiceUIConnectionConfig) => {
    const frameWindow = getFrameWindow();
    if (!frameWindow?.connectVoiceLiveAvatar) {
      throw new Error("The iframe is not ready yet.");
    }

    setErrorMessage(null);
    setIsConnecting(true);
    try {
      await frameWindow.connectVoiceLiveAvatar(config);
      setIsConnected(true);
    } catch (error) {
      setIsConnected(false);
      const message = error instanceof Error ? error.message : String(error);
      setErrorMessage(message);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectIframe = async () => {
    const frameWindow = getFrameWindow();
    if (!frameWindow?.disconnectVoiceLiveAvatar) {
      setErrorMessage("The iframe is not ready yet.");
      return;
    }

    setErrorMessage(null);
    setIsConnecting(true);
    try {
      await frameWindow.disconnectVoiceLiveAvatar();
      setIsConnected(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setErrorMessage(message);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <main className="flex min-h-screen bg-slate-200">
      <aside className="w-[22rem] shrink-0 border-r border-slate-300 bg-white">
        <ChatInterface
          showVoiceUi={false}
          registerWindowApi={false}
          initialConfig={savedConfig}
          onConfigChange={handleConfigChange}
          onConnectRequest={connectIframe}
        />
        <div className="space-y-3 border-t border-slate-200 px-4 py-4">
          <Button
            className="w-full"
            variant="outline"
            onClick={disconnectIframe}
            disabled={!frameReady || isConnecting || !isConnected}
          >
            Disconnect iframe
          </Button>
          {errorMessage && (
            <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </p>
          )}
        </div>
      </aside>

      <section className="flex flex-1 flex-col p-4">
        <div className="mb-3 flex items-center justify-between rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700">
          <span>
            {frameReady
              ? "Embedded Voice UI is ready."
              : "Waiting for embedded Voice UI..."}
          </span>
          <span>{isConnected ? "Connected" : "Disconnected"}</span>
        </div>
        <iframe
          ref={iframeRef}
          title="Voice UI iframe test harness"
          src="/"
          className="min-h-0 flex-1 rounded-xl border border-slate-300 bg-white"
          onLoad={() => {
            setFrameReady(true);
            setErrorMessage(null);
          }}
        />
      </section>
    </main>
  );
}