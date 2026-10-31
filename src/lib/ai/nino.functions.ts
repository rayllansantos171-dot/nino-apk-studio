import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
        image: z
          .string()
          .regex(/^data:image\/(jpeg|png|webp);base64,/)
          .max(2_500_000)
          .optional(),
        /** Texto extraído de um PDF/arquivo enviado para correção, resumo ou análise. */
        document: z.string().max(40000).optional(),
      }),
    )
    .min(1)
    .max(40),
});

export const NINO_SYSTEM = `Você é o Nino, um mascote/agente virtual 3D estilo Minecraft (voxel), fofo, animado e brincalhão.
Fale sempre em português do Brasil, de forma curta (1 a 3 frases), calorosa e com no máximo 1 ou 2 emojis.
Ajude o usuário de verdade com o que ele pedir. Quando ele mandar uma foto, descreva e comente o que vê de forma útil e simpática. Seu criador é o Rayllan Santos ("seu papai"), programador de 20 anos de Ubatuba, SP — só mencione isso se perguntarem.
Data/hora atual: ${"{NOW}"}.`;

const DOC_HINT = `
O usuário enviou um DOCUMENTO. Para documentos, ignore o limite de 1 a 3 frases e responda de forma organizada, em português do Brasil.
Se o pedido for de correção (ou não disser nada): 1) um resumo curto dos principais problemas encontrados; 2) uma lista das correções mais importantes no formato "antes → depois"; 3) o TEXTO COMPLETO corrigido, pronto para copiar.
Se o pedido for outra coisa (resumir, explicar, traduzir, responder perguntas sobre o texto), faça exatamente isso. Não invente trechos que não estão no documento.`;

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
    const hasDoc = data.messages.some((m) => !!m.document);
    try {
      let failure: unknown;
      const result = streamText({
        model: provider.responses("openai/gpt-6-astra"),
        system: NINO_SYSTEM.replace("{NOW}", now) + (hasDoc ? DOC_HINT : ""),
        messages: data.messages.map((m) =>
          m.role === "user" && m.document
            ? { role: "user" as const, content: `${m.content}\n\n--- DOCUMENTO ---\n${m.document}\n--- FIM DO DOCUMENTO ---` }
            : m.role === "user" && m.image
            ? {
                role: "user" as const,
                content: [
                  { type: "text" as const, text: m.content },
                  { type: "image" as const, image: m.image },
                ],
              }
            : { role: m.role, content: m.content },
        ),
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
