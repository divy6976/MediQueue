/** Safe error text for API responses and logs. */
export function formatError(err: unknown): string {
  if (err instanceof Error) {
    const cause = (err as Error & { cause?: unknown }).cause;
    const parts = [err.message, cause ? formatError(cause) : ""].filter(Boolean);
    if (parts.length) return parts.join(" | ");
    return err.stack ?? err.name ?? "Unknown Error";
  }
  if (typeof err === "object" && err !== null) {
    const o = err as Record<string, unknown>;
    const msg = [o.message, o.detail, o.code].filter((x) => typeof x === "string" && x) as string[];
    if (msg.length) return msg.join(" | ");
    try {
      return JSON.stringify(err);
    } catch {
      return String(err);
    }
  }
  return String(err);
}

export function getDatabaseUrlHint(): {
  configured: boolean;
  host: string | null;
} {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) {
    return { configured: false, host: null };
  }
  try {
    const url = new URL(raw.replace(/^postgresql:\/\//, "http://"));
    return { configured: true, host: url.hostname };
  } catch {
    return { configured: true, host: "(unparseable)" };
  }
}
