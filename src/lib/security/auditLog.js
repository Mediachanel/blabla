import { getClientIp } from "@/lib/security/requestIdentity";

const REDACTED_KEYS = new Set(["password", "token", "secret", "jwt", "cookie", "credential"]);

function sanitizeDetails(details) {
  return Object.fromEntries(
    Object.entries(details || {}).map(([key, value]) => {
      if (REDACTED_KEYS.has(String(key).toLowerCase())) return [key, "[REDACTED]"];
      if (value === undefined) return [key, null];
      return [key, typeof value === "string" ? value.slice(0, 160) : value];
    })
  );
}

export function auditSecurityEvent(request, event, details = {}) {
  const url = request?.url ? new URL(request.url) : null;
  console.info("[SECURITY_AUDIT]", JSON.stringify({
    at: new Date().toISOString(),
    event,
    ip: request ? getClientIp(request) : "unknown",
    method: request?.method || "",
    path: url?.pathname || "",
    ...sanitizeDetails(details)
  }));
}
