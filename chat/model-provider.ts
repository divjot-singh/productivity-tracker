export type ModelProvider = (prompt: string) => Promise<string>;
export type StreamingModelProvider = (prompt: string) => Promise<string>;

type ProviderKind = "ollama" | "openai" | "gemini";

interface ProviderConfig {
  kind: ProviderKind;
  model: string;
  baseUrl: string;
  apiKey?: string;
  temperature: number;
}

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

type OllamaGenerateResponse = {
  response?: string;
};

type OpenAIStreamChunk = {
  choices?: Array<{
    delta?: {
      content?: string;
    };
    finish_reason?: string | null;
  }>;
};

type OllamaStreamChunk = {
  response?: string;
  done?: boolean;
};

type GeminiStreamChunk = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
        thoughtSignature?: string;
      }>;
    };
  }>;
};

const NOOP_ON_DELTA = () => {};

function resolveProviderConfig(): ProviderConfig {
  const kind =
    (process.env.CHAT_MODEL_PROVIDER as ProviderKind | undefined) ??
    (process.env.NODE_ENV === "production" ? "openai" : "ollama");

  if (kind === "ollama") {
    return {
      kind,
      baseUrl: process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434",
      model: process.env.OLLAMA_MODEL ?? "qwen3:8b",
      temperature: Number(process.env.OLLAMA_TEMPERATURE ?? "0.2"),
    };
  }

  if (kind === "gemini") {
    return {
      kind,
      baseUrl: "https://generativelanguage.googleapis.com/v1beta/models",
      model: process.env.GEMINI_MODEL ?? "gemini-3.5-flash-lite",
      apiKey: process.env.GEMINI_API_KEY,
      temperature: Number(process.env.GEMINI_TEMPERATURE ?? "0.2"),
    };
  }

  return {
    kind: "openai",
    baseUrl: process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    apiKey: process.env.OPENAI_API_KEY,
    temperature: Number(process.env.OPENAI_TEMPERATURE ?? "0.2"),
  };
}

function createOpenAIProvider(config: ProviderConfig): ModelProvider {
  return createOpenAIStreamingProvider(config, NOOP_ON_DELTA);
}

function createOllamaProvider(config: ProviderConfig): ModelProvider {
  return createOllamaStreamingProvider(config, NOOP_ON_DELTA);
}

function createOpenAIStreamingProvider(
  config: ProviderConfig,
  onDelta: (chunk: string) => void,
): StreamingModelProvider {
  if (!config.apiKey) {
    throw new Error("Missing OPENAI_API_KEY for OpenAI model provider");
  }

  return async (prompt: string): Promise<string> => {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        temperature: config.temperature,
        stream: true,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `OpenAI provider request failed (${response.status}): ${body.slice(0, 300)}`,
      );
    }

    if (!response.body) {
      throw new Error("OpenAI provider returned an empty stream");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let output = "";

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split("\n\n");
      buffer = events.pop() ?? "";

      for (const event of events) {
        const lines = event
          .split("\n")
          .filter((line) => line.startsWith("data:"));

        for (const line of lines) {
          const payload = line.startsWith("data: ")
            ? line.slice("data: ".length)
            : line.slice("data:".length);

          if (payload === "[DONE]") {
            continue;
          }

          let chunk: OpenAIStreamChunk;
          try {
            chunk = JSON.parse(payload) as OpenAIStreamChunk;
          } catch {
            continue;
          }

          const delta = chunk.choices?.[0]?.delta?.content;
          if (!delta) {
            continue;
          }

          output += delta;
          onDelta(delta);
        }
      }
    }

    if (!output.trim()) {
      throw new Error("OpenAI provider returned an empty response");
    }

    return output.trim();
  };
}

function createOllamaStreamingProvider(
  config: ProviderConfig,
  onDelta: (chunk: string) => void,
): StreamingModelProvider {
  return async (prompt: string): Promise<string> => {
    const response = await fetch(`${config.baseUrl}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        prompt,
        stream: true,
        options: {
          temperature: config.temperature,
        },
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `Ollama provider request failed (${response.status}): ${body.slice(0, 300)}`,
      );
    }

    if (!response.body) {
      throw new Error("Ollama provider returned an empty stream");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let output = "";

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
          continue;
        }

        let chunk: OllamaStreamChunk;
        try {
          chunk = JSON.parse(trimmed) as OllamaStreamChunk;
        } catch {
          continue;
        }

        const delta = chunk.response ?? "";
        if (delta) {
          output += delta;
          onDelta(delta);
        }
      }
    }

    const finalOutput = output.trim();
    if (!finalOutput) {
      throw new Error("Ollama provider returned an empty response");
    }

    return finalOutput;
  };
}

function createGeminiProvider(config: ProviderConfig): ModelProvider {
  return createGeminiStreamingProvider(config, NOOP_ON_DELTA);
}

function createGeminiStreamingProvider(
  config: ProviderConfig,
  onDelta: (chunk: string) => void,
): StreamingModelProvider {
  if (!config.apiKey) {
    throw new Error("Missing GEMINI_API_KEY for Gemini model provider");
  }

  return async (prompt: string): Promise<string> => {
    console.log("\n=== GEMINI API REQUEST ===");
    console.log("Model:", config.model);
    console.log("Temperature:", config.temperature);
    console.log(
      "Request URL:",
      `${config.baseUrl}/${config.model}:streamGenerateContent`,
    );
    console.log("=== END GEMINI API REQUEST ===\n");

    const response = await fetch(
      `${config.baseUrl}/${config.model}:streamGenerateContent?key=${config.apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: config.temperature,
          },
        }),
        cache: "no-store",
      },
    );

    if (!response.ok) {
      const body = await response.text();
      const errorMessage = `Gemini provider request failed (${response.status}): ${body.slice(0, 300)}`;
      console.error("Gemini API Error:", {
        status: response.status,
        body: body.substring(0, 500),
      });
      throw new Error(errorMessage);
    }

    if (!response.body) {
      throw new Error("Gemini provider returned an empty stream");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let output = "";

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
    }

    // Gemini streamGenerateContent returns a JSON array: [{...}, {...}, ...]
    // Parse the full buffer as a JSON array of chunks
    let chunks: GeminiStreamChunk[] = [];
    try {
      chunks = JSON.parse(buffer) as GeminiStreamChunk[];
    } catch {
      // Fallback: try line-by-line for partial/malformed responses
      const lines = buffer.split("\n");
      for (const line of lines) {
        const trimmed = line.trim().replace(/^,/, "");
        if (!trimmed || trimmed === "[" || trimmed === "]") continue;
        try {
          chunks.push(JSON.parse(trimmed) as GeminiStreamChunk);
        } catch {
          continue;
        }
      }
    }

    for (const chunk of chunks) {
      const parts = chunk.candidates?.[0]?.content?.parts ?? [];
      const delta = parts
        .filter((part) => !part.thoughtSignature)
        .map((part) => part.text ?? "")
        .join("");

      if (delta) {
        output += delta;
        onDelta(delta);
      }
    }

    const finalOutput = output.trim();
    if (!finalOutput) {
      console.error("Gemini returned empty response:", {
        allChunks: output,
        length: output.length,
      });
      throw new Error(
        "Gemini provider returned an empty response. Check console for details.",
      );
    }

    console.log("\n=== GEMINI STREAMING COMPLETE ===");
    console.log("Response:", finalOutput);
    console.log("Total characters:", output.length);
    console.log("=== END GEMINI STREAMING ===\n");

    return finalOutput;
  };
}

export function createModelProvider(): ModelProvider {
  const config = resolveProviderConfig();

  if (config.kind === "ollama") {
    return createOllamaProvider(config);
  }

  if (config.kind === "gemini") {
    return createGeminiProvider(config);
  }

  return createOpenAIProvider(config);
}

export function createStreamingModelProvider(
  onDelta: (chunk: string) => void,
): StreamingModelProvider {
  const config = resolveProviderConfig();

  if (config.kind === "ollama") {
    return createOllamaStreamingProvider(config, onDelta);
  }

  if (config.kind === "gemini") {
    return createGeminiStreamingProvider(config, onDelta);
  }

  return createOpenAIStreamingProvider(config, onDelta);
}
