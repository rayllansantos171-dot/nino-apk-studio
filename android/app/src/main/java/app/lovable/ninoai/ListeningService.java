package app.lovable.ninoai;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.provider.Settings;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import androidx.core.app.NotificationCompat;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Escuta em segundo plano: só roda quando a pessoa liga, mostra uma notificação fixa com o botão
 * "Parar" e não grava áudio. Quando ouve "Nino ...", abre o app com a frase para o Nino responder.
 */
public class ListeningService extends Service {
    static volatile boolean running = false;

    private static final String ACTION_STOP = "app.lovable.ninoai.STOP_LISTENING";
    private static final String CH_LISTEN = "nino_listen";
    private static final String CH_HEARD = "nino_heard";
    private static final Pattern WAKE = Pattern.compile("\\b(nino|ninho)\\b");

    private final Handler h = new Handler(Looper.getMainLooper());
    private SpeechRecognizer sr;
    private Intent recIntent;
    private boolean active = false;
    private int errors = 0;

    @Override public IBinder onBind(Intent intent) { return null; }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && ACTION_STOP.equals(intent.getAction())) stopSelf();
        return START_NOT_STICKY;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        try {
            startAsForeground();
        } catch (RuntimeException e) {
            stopSelf();
            return;
        }
        if (!SpeechRecognizer.isRecognitionAvailable(this)) {
            stopSelf();
            return;
        }
        recIntent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        recIntent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        recIntent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "pt-BR");
        recIntent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 3);
        recIntent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, false);
        recIntent.putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, getPackageName());
        active = true;
        running = true;
        h.post(this::startRec);
    }

    private void startRec() {
        if (!active) return;
        try {
            if (sr == null) {
                sr = SpeechRecognizer.createSpeechRecognizer(this);
                sr.setRecognitionListener(listener);
            }
            sr.startListening(recIntent);
        } catch (RuntimeException e) {
            resetRecognizer();
            h.postDelayed(this::startRec, 2000);
        }
    }

    private void resetRecognizer() {
        if (sr != null) {
            try { sr.cancel(); sr.destroy(); } catch (RuntimeException ignored) { }
            sr = null;
        }
    }

    private final RecognitionListener listener = new RecognitionListener() {
        @Override public void onReadyForSpeech(Bundle params) { }
        @Override public void onBeginningOfSpeech() { }
        @Override public void onRmsChanged(float rmsdB) { }
        @Override public void onBufferReceived(byte[] buffer) { }
        @Override public void onEndOfSpeech() { }
        @Override public void onPartialResults(Bundle partialResults) { }
        @Override public void onEvent(int eventType, Bundle params) { }

        @Override
        public void onResults(Bundle results) {
            errors = 0;
            ArrayList<String> list = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
            if (list != null) {
                for (String candidate : list) {
                    String command = extractCommand(candidate);
                    if (command != null) {
                        deliver(command);
                        break;
                    }
                }
            }
            h.postDelayed(ListeningService.this::startRec, 250);
        }

        @Override
        public void onError(int error) {
            if (!active) return;
            if (error == SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS) {
                stopSelf();
                return;
            }
            long delay = 300;
            if (error == SpeechRecognizer.ERROR_RECOGNIZER_BUSY || error == SpeechRecognizer.ERROR_CLIENT) {
                resetRecognizer();
                delay = 800;
            } else if (error != SpeechRecognizer.ERROR_NO_MATCH && error != SpeechRecognizer.ERROR_SPEECH_TIMEOUT) {
                // Erro de rede/servidor: espera mais para não ficar em laço rápido.
                resetRecognizer();
                delay = ++errors < 6 ? 1000 : 5000;
            }
            h.postDelayed(ListeningService.this::startRec, delay);
        }
    };

    /** Procura "Nino" na frase e devolve o que veio depois (ou "Oi, Nino!" se só chamou). */
    static String extractCommand(String heard) {
        if (heard == null) return null;
        String norm = Normalizer.normalize(heard, Normalizer.Form.NFD).replaceAll("\\p{M}+", "").toLowerCase(Locale.ROOT);
        Matcher m = WAKE.matcher(norm);
        if (!m.find()) return null;
        int end = Math.min(m.end(), heard.length());
        String rest = heard.substring(end).replaceAll("^[\\s,.!?:;-]+", "").trim();
        return rest.isEmpty() ? "Oi, Nino!" : rest;
    }

    /** Abre o app com a frase. Sem permissão de sobreposição, mostra uma notificação para tocar. */
    private void deliver(String command) {
        Intent i = new Intent(this, MainActivity.class);
        i.putExtra(NinoListenPlugin.EXTRA_TEXT, command);
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
        boolean canLaunch = Build.VERSION.SDK_INT < Build.VERSION_CODES.M || Settings.canDrawOverlays(this);
        if (canLaunch) {
            try {
                startActivity(i);
                return;
            } catch (RuntimeException ignored) { }
        }
        NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            nm.createNotificationChannel(new NotificationChannel(CH_HEARD, "Nino te ouviu", NotificationManager.IMPORTANCE_HIGH));
        }
        PendingIntent pi = PendingIntent.getActivity(this, 1, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Notification n = new NotificationCompat.Builder(this, CH_HEARD)
                .setContentTitle("Nino te ouviu")
                .setContentText("Toque para ver a resposta: " + command)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentIntent(pi)
                .setAutoCancel(true)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .build();
        nm.notify(3, n);
    }

    private void startAsForeground() {
        NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            nm.createNotificationChannel(new NotificationChannel(CH_LISTEN, "Nino ouvindo", NotificationManager.IMPORTANCE_LOW));
        }
        PendingIntent open = PendingIntent.getActivity(this, 0, new Intent(this, MainActivity.class), PendingIntent.FLAG_IMMUTABLE);
        PendingIntent stop = PendingIntent.getService(this, 2,
                new Intent(this, ListeningService.class).setAction(ACTION_STOP), PendingIntent.FLAG_IMMUTABLE);
        Notification n = new NotificationCompat.Builder(this, CH_LISTEN)
                .setContentTitle("Nino está ouvindo")
                .setContentText("Diga “Nino” e o que precisa. Toque em Parar para desligar.")
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentIntent(open)
                .addAction(0, "Parar", stop)
                .setOngoing(true)
                .build();
        if (Build.VERSION.SDK_INT >= 30) {
            startForeground(2, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE);
        } else {
            startForeground(2, n);
        }
    }

    @Override
    public void onDestroy() {
        active = false;
        running = false;
        h.removeCallbacksAndMessages(null);
        resetRecognizer();
        super.onDestroy();
    }
}
