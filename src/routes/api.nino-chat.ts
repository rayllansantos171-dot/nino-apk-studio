import { createFileRoute } from '@tanstack/react-router';
import { askNino } from '@/lib/ai/nino.functions';

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

/**
 * Endpoint usado pelo serviço de voz do Android: recebe { text } e devolve { ok, text | error }.
 * Assim o Nino responde em voz alta mesmo com o app fechado.
 */
export const Route = createFileRoute('/api/nino-chat')({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        if (request.headers.get('x-nino-key') !== APP_KEY) return json({ ok: false, error: 'Não autorizado.' }, 401);
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'desconhecido';
        if (!allowed(ip)) return json({ ok: false, error: 'Muitas perguntas! Espere um pouquinho. ⏳' }, 429);
        let text = '';
        try {
          const body = (await request.json()) as { text?: unknown };
          text = typeof body.text === 'string' ? body.text.trim().slice(0, 400) : '';
        } catch {
          return json({ ok: false, error: 'Pedido inválido.' }, 400);
        }
        if (!text) return json({ ok: false, error: 'Não ouvi nada.' }, 400);
        const r = await askNino({ data: { messages: [{ role: 'user', content: text }] } });
        return json(r, r.ok ? 200 : 502);
      },
    },
  },
});
