// Anonymous (non-PII) user identifier for retention measurement.
// Stored in localStorage on the client. Not sent to the server.

export function getOrCreateAnonUserId(): string {
  if (typeof window === "undefined") return "";

  const KEY = "nw_anon_user_id";
  try {
    const existing = window.localStorage.getItem(KEY);
    if (existing && typeof existing === "string" && existing.length > 0) return existing;

    const id =
      typeof window.crypto !== "undefined" && typeof window.crypto.randomUUID === "function"
        ? window.crypto.randomUUID()
        : `nw_${Date.now()}_${Math.random().toString(16).slice(2)}`;

    window.localStorage.setItem(KEY, id);
    return id;
  } catch (e) {
    return `nw_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }
}
