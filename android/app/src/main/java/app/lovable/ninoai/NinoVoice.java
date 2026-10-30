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
            tts = new TextToSpeech(ctx.getApplicationContext(), new TextToSpeech.OnInitListener() {
                @Override public void onInit(int status) {
                    synchronized (NinoVoice.class) {
                        if (status != TextToSpeech.SUCCESS) { tts = null; pending.clear(); return; }
                        int r = tts.setLanguage(new Locale("pt", "BR"));
                        if (r == TextToSpeech.LANG_MISSING_DATA || r == TextToSpeech.LANG_NOT_SUPPORTED) {
                            tts.setLanguage(Locale.getDefault());
                        }
                        tts.setSpeechRate(1.05f);
                        tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                            @Override public void onStart(String id) { busyUntil = System.currentTimeMillis() + 60000; }
                            @Override public void onDone(String id) { busyUntil = System.currentTimeMillis() + 700; }
                            @Override public void onError(String id) { busyUntil = System.currentTimeMillis() + 300; }
                        });
                        ready = true;
                        for (String t : pending) say(t);
                        pending.clear();
                    }
                }
            });
        } else if (!ready) {
            pending.add(clean);
        } else {
            say(clean);
        }
    }

    private static void say(String t) {
        Bundle b = new Bundle();
        tts.speak(t, TextToSpeech.QUEUE_FLUSH, b, "nino-" + System.nanoTime());
    }

    static synchronized void stop() {
        if (tts != null && ready) tts.stop();
        busyUntil = 0;
    }
}
