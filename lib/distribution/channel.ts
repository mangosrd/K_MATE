const ONESTORE_USER_AGENT_MARKER = "K-MATE-ONESTORE";

/** True only inside the APK produced by scripts/build-onestore.ps1. */
export function isOneStoreBuild(): boolean {
  return (
    typeof navigator !== "undefined" &&
    navigator.userAgent.includes(ONESTORE_USER_AGENT_MARKER)
  );
}

