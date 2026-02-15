/**
 * LLM provider config — URLs isolated for easy changes.
 * Supports LLM_BASE_URL override via env.
 */

export const MISTRAL_BASE_URL = "https://api.mistral.ai/v1";
export const OPENAI_BASE_URL = "https://api.openai.com/v1";

export const DEFAULT_MISTRAL_MODEL = "mistral-small-latest";
export const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";

export type LLMProvider = "mistral" | "openai" | "none";

export function getLLMConfig(): {
  provider: LLMProvider;
  apiKey: string | null;
  baseUrl: string;
  model: string;
} {
  const provider = (process.env.LLM_PROVIDER ?? "none") as LLMProvider;
  const baseUrlEnv = process.env.LLM_BASE_URL?.trim();
  const modelEnv = process.env.LLM_MODEL?.trim();

  if (provider === "mistral") {
    const key = process.env.MISTRAL_API_KEY?.trim();
    return {
      provider: key ? "mistral" : "none",
      apiKey: key ?? null,
      baseUrl: baseUrlEnv ?? MISTRAL_BASE_URL,
      model: modelEnv ?? DEFAULT_MISTRAL_MODEL,
    };
  }
  if (provider === "openai") {
    const key = process.env.OPENAI_API_KEY?.trim();
    return {
      provider: key ? "openai" : "none",
      apiKey: key ?? null,
      baseUrl: baseUrlEnv ?? OPENAI_BASE_URL,
      model: modelEnv ?? DEFAULT_OPENAI_MODEL,
    };
  }
  return {
    provider: "none",
    apiKey: null,
    baseUrl: baseUrlEnv ?? OPENAI_BASE_URL,
    model: modelEnv ?? DEFAULT_OPENAI_MODEL,
  };
}
