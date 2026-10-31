import { createFileRoute } from '@tanstack/react-router';
import { NINO_SYSTEM } from '@/lib/ai/nino.functions';

/** Chave simples do app Android (evita chamadas aleatórias; não é um segredo forte). */
const APP_KEY = 'nino-android-v1';

// Limite por IP (em memória, por instância): 20 perguntas por minuto.
const hits = new Map<string, number[]>();
function allowed(ip: string): boolean {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  if (list.length >= 20) {
    hits.set(ip, list);
    return false;
  }
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 2000) hits.clear();
  return true;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });

type Msg = { role: 'user' | 'assistant'; content: string };

const VOICE_HINT =
  '\nVocê está falando por VOZ: responda em no máximo 2 frases curtas e naturais, sem listas, sem markdown e sem emojis.';

/**
 * Endpoint usado pelo serviço de voz do Android.
 * Entrada: { messages: [{role, content}] } (ou { text }). Resposta em TEXTO EM STREAM: o app Android fala cada frase
 * assim que ela chega (baixa latência), sem esperar a resposta inteira.
 */
export const Route = createFileRoute('/api/nino-chat')({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        if (request.headers.get('x-nino-key') !== APP_KEY) return json({ ok: false, error: 'Não autorizado.' }, 401);
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'desconhecido';
        if (!allowed(ip)) return json({ ok: false, error: 'Muitas perguntas! Espere um pouquinho. ⏳' }, 429);

        let messages: Msg[] = [];
        try {
          const body = (await request.json()) as { text?: unknown; messages?: unknown };
          if (Array.isArray(body.messages)) {
            messages = body.messages
              .filter(
                (m): m is Msg =>
                  !!m &&
                  typeof m === 'object' &&
                  ((m as Msg).role === 'user' || (m as Msg).role === 'assistant') &&
                  typeof (m as Msg).content === 'string',
              )
              .slice(-10)
              .map((m) => ({ role: m.role, content: m.content.trim().slice(0, 400) }))
              .filter((m) => m.content.length > 0);
          } else if (typeof body.text === 'string' && body.text.trim()) {
            messages = [{ role: 'user', content: body.text.trim().slice(0, 400) }];
          }
        } catch {
          return json({ ok: false, error: 'Pedido inválido.' }, 400);
        }
        if (messages.length === 0 || messages[messages.length - 1]?.role !== 'user') {
          return json({ ok: false, error: 'Não ouvi nada.' }, 400);
        }

        const apiKey = process.env['LOVABLE_API_KEY'];
        if (!apiKey) return json({ ok: false, error: 'IA não configurada.' }, 500);

        const { createOpenAI } = await import('@ai-sdk/openai');
        const { streamText } = await import('ai');
        const { createLovableAiGatewayRunIdFetch } = await import('@/lib/ai/run-id.server');
        const runIdFetch = createLovableAiGatewayRunIdFetch();
        const provider = createOpenAI({
          baseURL: 'https://ai.gateway.lovable.dev/v1',
          apiKey,
          headers: { 'Lovable-API-Key': apiKey, 'X-Lovable-AIG-SDK': 'vercel-ai-sdk' },
          fetch: runIdFetch.fetch,
        });
        const now = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
        const enc = new TextEncoder();
        const stream = new ReadableStream<Uint8Array>({
          async start(controller) {
            let failed = false;
            try {
              const result = streamText({
                model: provider.responses('openai/gpt-6-astra'),
                system: NINO_SYSTEM.replace('{NOW}', now) + VOICE_HINT,
                messages,
                onError: () => {
                  failed = true;
                },
                providerOptions: {
                  openai: {
                    store: false,
                    forceReasoning: true,
                    reasoningEffort: 'low',
                    reasoningSummary: 'auto',
                    include: ['reasoning.encrypted_content'],
                  },
                },
              });
              for await (const chunk of result.textStream) controller.enqueue(enc.encode(chunk));
            } catch (e) {
              console.error('nino-chat stream error', (e as Error)?.message);
              failed = true;
            }
            // Marca de erro que o app reconhece (NUL no início da linha final)
            if (failed) controller.enqueue(enc.encode('\u0000ERRO'));
            controller.close();
          },
        });
        return new Response(stream, {
          headers: {
            'content-type': 'text/plain; charset=utf-8',
            'cache-control': 'no-cache, no-transform',
            'x-accel-buffering': 'no',
          },
        });
      },
    },
  },
});
