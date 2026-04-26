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
    <main className="flex h-screen flex-col overflow-hidden bg-[radial-gradient(circle_at_top,_#f8fafc,_#dbe4f0_52%,_#c2d0e1)] text-slate-900 lg:flex-row">
      <aside className="max-h-[50vh] shrink-0 overflow-y-auto border-b border-slate-300/80 bg-white/90 backdrop-blur lg:max-h-none lg:w-[22rem] lg:border-b-0 lg:border-r">
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

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden p-4 sm:p-6">
        <div className="mb-4 flex shrink-0 items-center justify-between rounded-2xl border border-white/70 bg-white/65 px-4 py-3 text-sm text-slate-700 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:mb-6">
          <span>
            {frameReady
              ? "Embedded Voice UI is ready."
              : "Waiting for embedded Voice UI..."}
          </span>
          <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-white">
            {isConnected ? "Connected" : "Disconnected"}
          </span>
        </div>

        <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden">
          <div className="relative flex h-full max-h-full w-full items-center justify-center">
            <div className="relative h-full max-h-full w-auto max-w-full aspect-[430/932]">
            <div className="pointer-events-none absolute inset-x-6 top-5 z-10 flex justify-center">
              <div className="h-7 w-36 rounded-full bg-black/85 shadow-[0_8px_20px_rgba(0,0,0,0.45)]" />
            </div>
            <div className="pointer-events-none absolute -left-1 top-28 h-20 w-1 rounded-full bg-slate-700/80" />
            <div className="pointer-events-none absolute -right-1 top-36 h-24 w-1 rounded-full bg-slate-700/80" />
            <div className="pointer-events-none absolute -right-1 top-64 h-12 w-1 rounded-full bg-slate-700/80" />

            <div className="relative h-full overflow-hidden rounded-[3rem] border border-slate-700/80 bg-slate-950 p-3 shadow-[0_28px_90px_rgba(15,23,42,0.35)]">
              <div className="absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(255,255,255,0.16),rgba(255,255,255,0))]" />
              <div className="relative h-full overflow-hidden rounded-[2.45rem] border border-slate-800 bg-white shadow-inner">
                <div className="flex h-full w-full flex-col bg-slate-100 pt-[30px]">
                  <iframe
                    ref={iframeRef}
                    title="Voice UI iframe test harness"
                    src="/"
                    className="min-h-0 flex-1 border-0 bg-white"
                    onLoad={() => {
                      setFrameReady(true);
                      setErrorMessage(null);
                    }}
                  />
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}