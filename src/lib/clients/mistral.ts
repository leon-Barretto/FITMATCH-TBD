import { getLLMConfig } from "@/lib/fitmatch/llm-config";

export type MistralJSONOptions = {
  system: string;
  user: string;
  schemaHint?: string;
  timeoutMs?: number;
};

const DEFAULT_TIMEOUT_MS = 8000;

export async function mistralJSON<T = unknown>(options: MistralJSONOptions): Promise<T> {
  const { system, user, schemaHint, timeoutMs = DEFAULT_TIMEOUT_MS } = options;
  const config = getLLMConfig();

  if (config.provider !== "mistral" || !config.apiKey) {
    throw new Error("Mistral not configured");
  }

  const url = config.baseUrl.replace(/\/$/, "") + "/chat/completions";
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: schemaHint ? `${user}\n\n${schemaHint}` : user },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    }),
    signal: controller.signal,
  });

  clearTimeout(timeoutId);

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Mistral API error: ${res.status} ${err}`);
  }

  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const raw = data.choices?.[0]?.message?.content;
  if (!raw || typeof raw !== "string") {
    throw new Error("Empty or invalid Mistral response");
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error("Invalid JSON in Mistral response");
  }
}
