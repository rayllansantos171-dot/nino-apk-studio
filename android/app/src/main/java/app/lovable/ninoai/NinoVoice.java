package app.lovable.ninoai;

import android.content.Context;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/** Voz do Nino (texto para fala nativo, pt-BR). Funciona sem o WebView, inclusive com o app fechado. */
final class NinoVoice {
    private static TextToSpeech tts;
    private static boolean ready = false;
    private static boolean warned = false;
    private static final List<String> pending = new ArrayList<>();
    private static volatile long busyUntil = 0;

    private NinoVoice() { }

    /** O Nino está falando (ou acabou de falar)? Usado para o microfone não ouvir a própria voz dele. */
    static boolean isBusy() {
        return System.currentTimeMillis() < busyUntil;
    }

    static synchronized void speak(Context ctx, String text) {
        final String clean = text == null ? "" : text.replaceAll("[\\x{1F000}-\\x{1FFFF}\\x{2600}-\\x{27BF}\\x{FE0F}]", "").trim();
        if (clean.isEmpty()) return;
        busyUntil = System.currentTimeMillis() + 800 + clean.length() * 75L;
        if (tts == null) {
            pending.add(clean);
            create(ctx.getApplicationContext());
        } else if (!ready) {
            pending.add(clean);
        } else {
            say(ctx.getApplicationContext(), clean);
        }
    }

    private static void create(final Context app) {
        ready = false;
        tts = new TextToSpeech(app, new TextToSpeech.OnInitListener() {
            @Override public void onInit(int status) {
                synchronized (NinoVoice.class) {
                    if (status != TextToSpeech.SUCCESS) {
                        failed(app);
                        return;
                    }
                    int r = tts.setLanguage(new Locale("pt", "BR"));
                    if (r == TextToSpeech.LANG_MISSING_DATA || r == TextToSpeech.LANG_NOT_SUPPORTED) {
                        r = tts.setLanguage(new Locale("pt"));
                    }
                    if (r == TextToSpeech.LANG_MISSING_DATA || r == TextToSpeech.LANG_NOT_SUPPORTED) {
                        // Sem voz em português: fala com a voz padrão do aparelho em vez de ficar mudo.
                        tts.setLanguage(Locale.getDefault());
                        warnOnce("Sem voz em português no aparelho. Instale em Configurações > Saída de texto para voz.");
                    }
                    pickBestVoice();
                    tts.setSpeechRate(1.05f);
                    tts.setPitch(1.1f); // um pouco mais agudo: voz de mascote
                    tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                        @Override public void onStart(String id) { busyUntil = System.currentTimeMillis() + 60000; }
                        @Override public void onDone(String id) { busyUntil = System.currentTimeMillis() + 700; }
                        @Override public void onError(String id) { busyUntil = System.currentTimeMillis() + 300; }
                    });
                    ready = true;
                    List<String> copy = new ArrayList<>(pending);
                    pending.clear();
                    for (String t : copy) say(app, t);
                }
            }
        });
    }

    /** Escolhe a voz pt-BR de maior qualidade instalada (as "neurais" do Google soam bem mais naturais). */
    private static void pickBestVoice() {
        try {
            android.speech.tts.Voice best = null;
            for (android.speech.tts.Voice v : tts.getVoices()) {
                if (v.getLocale() == null || !"pt".equals(v.getLocale().getLanguage())) continue;
                if (!"BR".equals(v.getLocale().getCountry())) continue;
                if (v.getFeatures() != null && v.getFeatures().contains(TextToSpeech.Engine.KEY_FEATURE_NOT_INSTALLED)) continue;
                if (best == null || v.getQuality() > best.getQuality()) best = v;
            }
            if (best != null) tts.setVoice(best);
        } catch (RuntimeException ignored) { }
    }

    private static void failed(Context app) {
        if (tts != null) { try { tts.shutdown(); } catch (RuntimeException ignored) { } }
        tts = null;
        ready = false;
        pending.clear();
        busyUntil = 0;
        warnOnce("Não consigo falar: instale o “Google Text-to-Speech” (voz do Android).");
    }

    private static void warnOnce(String msg) {
        if (warned) return;
        warned = true;
        FloatingNinoService.say(msg, false);
    }

    private static void say(Context app, String t) {
        if (tts == null) return;
        // Frase por frase: a primeira começa a sair antes de o resto ser processado (resposta mais rápida).
        int res = TextToSpeech.SUCCESS;
        for (String part : t.split("(?<=[.!?…])\\s+")) {
            if (part.trim().isEmpty()) continue;
            int r = tts.speak(part, TextToSpeech.QUEUE_ADD, new Bundle(), "nino-" + System.nanoTime());
            if (r == TextToSpeech.ERROR) res = r;
        }
        if (res == TextToSpeech.ERROR) {
            // O motor de voz morreu (por exemplo, o Google TTS foi atualizado): recria e tenta de novo.
            try { tts.shutdown(); } catch (RuntimeException ignored) { }
            tts = null;
            ready = false;
            pending.add(t);
            create(app);
        }
    }

    static synchronized void stop() {
        if (tts != null && ready) tts.stop();
        busyUntil = 0;
    }
}
