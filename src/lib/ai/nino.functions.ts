import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(4000) }))
    .min(1)
    .max(40),
});

const SYSTEM = `Você é o Nino, um mascote/agente virtual 3D estilo Minecraft (voxel), fofo, animado e brincalhão.
Fale sempre em português do Brasil, de forma curta (1 a 3 frases), calorosa e com no máximo 1 ou 2 emojis.
Ajude o usuário de verdade com o que ele pedir. Seu criador é o Rayllan Santos ("seu papai"), programador de 20 anos de Ubatuba, SP — só mencione isso se perguntarem.
Data/hora atual: ${"{NOW}"}.`;

export const askNino = createServerFn({ method: "POST" })
  .validator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { ok: false as const, error: "IA não configurada." };
    const { createOpenAI } = await import("@ai-sdk/openai");
    const { streamText } = await import("ai");
    const { createLovableAiGatewayRunIdFetch } = await import("./run-id.server");
    const runIdFetch = createLovableAiGatewayRunIdFetch();
    const provider = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey,
      headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
      fetch: runIdFetch.fetch,
    });
    const now = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
    try {
      let failure: unknown;
      const result = streamText({
        model: provider.responses("openai/gpt-6-astra"),
        system: SYSTEM.replace("{NOW}", now),
        messages: data.messages,
        onError: ({ error }) => {
          failure = error;
        },
        providerOptions: {
          openai: {
            store: false,
            forceReasoning: true,
            reasoningEffort: "low",
            reasoningSummary: "auto",
            include: ["reasoning.encrypted_content"],
          },
        },
      });
      const text = (await result.text).trim();
      if (failure) throw failure;
      if (!text) return { ok: false as const, error: "O Nino ficou sem palavras. Tente de novo." };
      return { ok: true as const, text };
    } catch (e: any) {
      const status = e?.statusCode ?? e?.status;
      console.error("askNino error", status, e?.message);
      if (status === 429) return { ok: false as const, error: "Muitas mensagens! Espere um pouquinho. ⏳" };
      if (status === 402) return { ok: false as const, error: "Os créditos de IA acabaram. Adicione créditos para continuar." };
      return { ok: false as const, error: "Não consegui pensar agora. Tente de novo." };
    }
  });
