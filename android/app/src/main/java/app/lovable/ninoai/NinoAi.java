package app.lovable.ninoai;

import android.os.Handler;
import android.os.Looper;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.List;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Conversa com a IA do Nino em segundo plano. A resposta chega em STREAM: cada frase completa é entregue assim que
 * termina (o Nino já começa a falar a primeira enquanto a IA ainda escreve o resto), como nos modos de voz em tempo real.
 */
final class NinoAi {
    interface Callback {
        void onSentence(String sentence);   // uma frase pronta para falar
        void onDone(String fullText);       // resposta completa (para a memória da conversa)
        void onError(String message);       // falha (sem internet, limite, etc.)
    }

    static final String URL_CHAT = "https://nino-apk-studio.lovable.app/api/nino-chat";
    private static final String KEY = "nino-android-v1";
    private static final Handler MAIN = new Handler(Looper.getMainLooper());

    private NinoAi() { }

    /** history: pares {papel, texto} anteriores (papel = "user" ou "assistant"); o último item deve ser do usuário. */
    static void ask(final List<String[]> history, final Callback cb) {
        new Thread(new Runnable() {
            @Override public void run() {
                String error = null;
                StringBuilder full = new StringBuilder();
                for (int attempt = 0; attempt < 2 && full.length() == 0; attempt++) {
                    error = attemptOnce(history, cb, full);
                    if (error == null || full.length() > 0) break;
                    if (error.startsWith("!")) break; // erro definitivo (limite etc.): não tenta de novo
                    try { Thread.sleep(600); } catch (InterruptedException ignored) { }
                }
                final String err = error;
                final String all = full.toString();
                MAIN.post(new Runnable() { @Override public void run() {
                    if (err != null && all.isEmpty()) cb.onError(err.startsWith("!") ? err.substring(1) : err);
                    else cb.onDone(all);
                } });
            }
        }, "nino-ai").start();
    }

    private static void post(final Runnable r) { MAIN.post(r); }

    /** Uma tentativa. Devolve null se deu certo, ou a mensagem de erro (prefixo "!" = não repetir). */
    private static String attemptOnce(List<String[]> history, final Callback cb, StringBuilder full) {
        HttpURLConnection c = null;
        try {
            JSONArray arr = new JSONArray();
            for (String[] m : history) arr.put(new JSONObject().put("role", m[0]).put("content", m[1]));
            c = (HttpURLConnection) new URL(URL_CHAT).openConnection();
            c.setRequestMethod("POST");
            c.setConnectTimeout(8000);
            c.setReadTimeout(30000);
            c.setDoOutput(true);
            c.setRequestProperty("Content-Type", "application/json; charset=utf-8");
            c.setRequestProperty("X-Nino-Key", KEY);
            OutputStream os = c.getOutputStream();
            os.write(new JSONObject().put("messages", arr).toString().getBytes("UTF-8"));
            os.close();
            int code = c.getResponseCode();
            if (code >= 400) {
                if (code == 429) return "!Muitas perguntas! Espere um pouquinho.";
                if (code == 401) return "!Meu acesso à IA foi recusado.";
                return code >= 500 ? "Não consegui pensar agora. Tenta de novo!" : "!Não entendi o pedido.";
            }
            InputStream is = c.getInputStream();
            byte[] buf = new byte[1024];
            StringBuilder pending = new StringBuilder();
            int n;
            java.io.ByteArrayOutputStream carry = new java.io.ByteArrayOutputStream();
            while ((n = is.read(buf)) > 0) {
                carry.write(buf, 0, n);
                // decodifica só até o último byte completo de UTF-8 para não quebrar acentos no meio
                byte[] bytes = carry.toByteArray();
                int cut = bytes.length;
                while (cut > 0 && (bytes[cut - 1] & 0xC0) == 0x80) cut--;          // continuação
                if (cut > 0 && (bytes[cut - 1] & 0x80) != 0 && (bytes[cut - 1] & 0xC0) == 0xC0) cut--; // início sem fim
                String text = new String(bytes, 0, cut, "UTF-8");
                carry.reset();
                carry.write(bytes, cut, bytes.length - cut);
                int mark = text.indexOf('\u0000');
                if (mark >= 0) { text = text.substring(0, mark); pending.append(text); full.append(text); flush(pending, true, cb); return full.length() > 0 ? null : "Não consegui pensar agora. Tenta de novo!"; }
                pending.append(text);
                full.append(text);
                flush(pending, false, cb);
            }
            flush(pending, true, cb);
            return full.length() == 0 ? "O Nino ficou sem palavras. Tenta de novo!" : null;
        } catch (Exception e) {
            return full.length() > 0 ? null : "Estou sem conexão agora. Tenta de novo daqui a pouco!";
        } finally {
            if (c != null) c.disconnect();
        }
    }

    /** Entrega as frases completas do buffer (terminadas em . ! ? … ou quebra de linha). */
    private static void flush(StringBuilder pending, boolean end, final Callback cb) {
        while (true) {
            int cut = -1;
            for (int i = 0; i < pending.length(); i++) {
                char ch = pending.charAt(i);
                boolean stop = ch == '.' || ch == '!' || ch == '?' || ch == '…' || ch == '\n';
                if (stop && (i + 1 >= pending.length() || Character.isWhitespace(pending.charAt(i + 1)) || ch == '\n')
                        && i >= 12) { cut = i + 1; break; } // frases muito curtas ("Oi.") esperam a próxima
            }
            if (cut < 0) break;
            final String sentence = pending.substring(0, cut).trim();
            pending.delete(0, cut);
            if (!sentence.isEmpty()) post(new Runnable() { @Override public void run() { cb.onSentence(sentence); } });
        }
        if (end) {
            final String rest = pending.toString().trim();
            pending.setLength(0);
            if (!rest.isEmpty()) post(new Runnable() { @Override public void run() { cb.onSentence(rest); } });
        }
    }
}
