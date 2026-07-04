import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export function createLovableAiGateway() {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");
  return createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: { "Lovable-API-Key": apiKey },
  });
}

export const DEFAULT_MODEL = "google/gemini-3-flash-preview";
