import type { StudioState } from "./types";

const PREFIX = "#s=";

function encode(obj: unknown): string {
  const json = JSON.stringify(obj);
  // unicode-safe base64
  const b64 = btoa(unescape(encodeURIComponent(json)));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function decode(s: string): unknown {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
  return JSON.parse(decodeURIComponent(escape(atob(b64 + pad))));
}

export function stateToUrl(state: StudioState, base = window.location.href.split("#")[0]): string {
  return `${base}${PREFIX}${encode(state)}`;
}
export function stateFromHash(hash = window.location.hash): StudioState | null {
  if (!hash.startsWith(PREFIX)) return null;
  try {
    return decode(hash.slice(PREFIX.length)) as StudioState;
  } catch { return null; }
}
export function exportStateJson(state: StudioState): string {
  return JSON.stringify(state, null, 2);
}
export function importStateJson(text: string): StudioState {
  return JSON.parse(text) as StudioState;
}
export async function copyShareLink(state: StudioState): Promise<string> {
  const url = stateToUrl(state);
  try { await navigator.clipboard.writeText(url); } catch {}
  return url;
}
