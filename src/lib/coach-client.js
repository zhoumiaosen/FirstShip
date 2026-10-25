import { createStarterGuidance } from "./guidance.js";

export const ONLINE_DEMO = import.meta.env?.MODE === "online-demo";

export async function getCoachHealth({
  onlineDemo = ONLINE_DEMO,
  fetchImpl = globalThis.fetch,
} = {}) {
  if (onlineDemo) return { ok: true, aiAvailable: false };
  const response = await fetchImpl("/api/health");
  if (!response.ok) throw new Error("The coach connection is unavailable.");
  return response.json();
}

export async function requestCoaching(
  body,
  { onlineDemo = ONLINE_DEMO, fetchImpl = globalThis.fetch } = {},
) {
  if (onlineDemo) return createStarterGuidance(body);
  const response = await fetchImpl("/api/coach", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(45000),
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(
      data.error ||
        "Your coach couldn’t respond. Your work is safe; please try again.",
    );
  return data;
}
