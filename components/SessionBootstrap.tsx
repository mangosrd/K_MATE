"use client";

import { useCallback, useEffect, useState } from "react";
import { ensureGuestAccount } from "@/lib/auth/store";


export default function SessionBootstrap({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  const initialize = useCallback(async () => {
    setFailed(false);
    const initialized = await ensureGuestAccount();
    setReady(initialized);
    setFailed(!initialized);
  }, []);

  useEffect(() => {
    // The app must not render API consumers until the anonymous session is issued.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void initialize();
  }, [initialize]);

  if (!ready) {
    return (
      <main className="session-bootstrap" role="status" aria-live="polite">
        <div className="session-bootstrap__plane">✈</div>
        <h1>{failed ? "연결을 확인해 주세요" : "탑승 준비 중이에요"}</h1>
        <p>
          {failed
            ? "인터넷 연결을 확인한 뒤 다시 시도해 주세요."
            : "안전한 개인 여행 계정을 준비하고 있어요."}
        </p>
        {failed && (
          <button type="button" onClick={() => void initialize()}>
            다시 시도
          </button>
        )}
      </main>
    );
  }

  return children;
}
