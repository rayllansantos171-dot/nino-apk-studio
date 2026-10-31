package app.lovable.ninoai;

import android.os.Handler;
import android.os.Looper;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import org.json.JSONObject;

/** Pergunta à IA do Nino direto do serviço (sem abrir o app), como um assistente de voz. */
final class NinoAi {
    interface Callback { void done(String reply); }

    static final String URL_CHAT = "https://nino-apk-studio.lovable.app/api/nino-chat";
    private static final String KEY = "nino-android-v1";
    private static final Handler MAIN = new Handler(Looper.getMainLooper());

    private NinoAi() { }

    static void ask(final String text, final Callback cb) {
        new Thread(new Runnable() {
            @Override public void run() {
                String reply;
                HttpURLConnection c = null;
                try {
                    c = (HttpURLConnection) new URL(URL_CHAT).openConnection();
                    c.setRequestMethod("POST");
                    c.setConnectTimeout(8000);
                    c.setReadTimeout(25000);
                    c.setDoOutput(true);
                    c.setRequestProperty("Content-Type", "application/json; charset=utf-8");
                    c.setRequestProperty("X-Nino-Key", KEY);
                    byte[] body = new JSONObject().put("text", text).toString().getBytes("UTF-8");
                    OutputStream os = c.getOutputStream();
                    os.write(body);
                    os.close();
                    int code = c.getResponseCode();
                    InputStream is = code >= 400 ? c.getErrorStream() : c.getInputStream();
                    ByteArrayOutputStream bo = new ByteArrayOutputStream();
                    byte[] buf = new byte[2048];
                    int n;
                    while (is != null && (n = is.read(buf)) > 0) bo.write(buf, 0, n);
                    JSONObject j = new JSONObject(bo.toString("UTF-8"));
                    reply = j.optString(j.optBoolean("ok") ? "text" : "error", "");
                    if (reply.isEmpty()) reply = "Não consegui pensar agora. Tenta de novo!";
                } catch (Exception e) {
                    reply = "Estou sem conexão agora. Tenta de novo daqui a pouco!";
                } finally {
                    if (c != null) c.disconnect();
                }
                final String out = reply;
                MAIN.post(new Runnable() { @Override public void run() { cb.done(out); } });
            }
        }, "nino-ai").start();
    }
}
