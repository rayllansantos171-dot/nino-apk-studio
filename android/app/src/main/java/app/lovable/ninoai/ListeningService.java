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

    private static final String WAKE_ONLY = "\u0000wake";
    private static final String ACTION_STOP = "app.lovable.ninoai.STOP_LISTENING";
    private static final String CH_LISTEN = "nino_listen";
    private static final String CH_HEARD = "nino_heard";
    private static final Pattern WAKE = Pattern.compile("\\b(nino|ninho|ninu|ninio|nineu|ni no)\\b");
    private static final Pattern P_FLIP = Pattern.compile("\\b(cambalhota|salto mortal|mortal|pirueta|backflip|flip)\\b");
    private static final Pattern P_JUMP = Pattern.compile("\\b(pul[aeo]r?|pulando|pulinho|pulo|salta[r]?|salte)\\b");
    private static final Pattern P_SPIN = Pattern.compile("\\b(gir[ae]r?|rodopi[ae]r?|rod[ae]r?|roda)\\b");
    private static final Pattern P_DANCE = Pattern.compile("\\b(danc[ae]r?|dancinha|bail[ae]r?|rebol[ae]r?)\\b");
    private static final Pattern P_WAVE = Pattern.compile("\\b(acen[ae]r?|tchau|ola|oi|eai|salve)\\b");
    private static final Pattern P_WALK = Pattern.compile("\\b(and[ae]r?|andando|caminh[ae]r?|passei[ae]r?|corr[ae]r?|volta|vai|va)\\b");
    private static final Pattern P_RIGHT = Pattern.compile("\\b(direita|direito)\\b");
    private static final Pattern P_LEFT = Pattern.compile("\\b(esquerda|esquerdo)\\b");
    private static final Pattern P_RUN = Pattern.compile("\\b(corr[ae]r?|correndo)\\b");
    private static final Pattern P_SIT = Pattern.compile("\\b(senta[r]?|sente)\\b");
    private static final Pattern P_SLEEP = Pattern.compile("\\b(dorm[ei]r?|durma|soneca|cochil[ae]r?)\\b");
    private static final Pattern P_CLAP = Pattern.compile("\\b(palmas|aplaud[ei]r?|aplausos)\\b");
    private static final Pattern P_FLEX = Pattern.compile("\\b(forca|musculos?|flexion[ae]r?)\\b");
    private static final Pattern P_BOW = Pattern.compile("\\b(reverencia|curv[ae]r?|agradece[r]?)\\b");
    private static final Pattern P_LAUGH = Pattern.compile("\\b(rir|gargalh[ae]r?|risada|sorri[ar]?)\\b");
    private static final Pattern P_CRY = Pattern.compile("\\b(chora[r]?|chore)\\b");
    private static final Pattern P_ANGRY = Pattern.compile("\\b(bravo|raiva|furioso|irrite)\\b");
    private static final Pattern P_LOVE = Pattern.compile("\\b(beijo|abraco|abracar|carinho)\\b");
    private static final Pattern P_THINK = Pattern.compile("\\b(pensa[r]?|reflete[r]?)\\b");
    private static final Pattern P_STOP = Pattern.compile("\\b(pare|parar|quieto|parado|congela[r]?)\\b");

    private final Handler h = new Handler(Looper.getMainLooper());
    private SpeechRecognizer sr;
    private Intent recIntent;
    private boolean active = false;
    private int errors = 0;
    /** Depois de só chamar "Nino", a próxima frase (até esse instante) vale como ordem, sem repetir o nome. */
    private long awaitUntil = 0;
    private boolean handledPartial = false;
    private final Runnable restart = new Runnable() { @Override public void run() { startRec(); } };

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
        recIntent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        recIntent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        recIntent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "pt-BR");
        recIntent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 3);
        recIntent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
        recIntent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, "pt-BR");
        recIntent.putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, getPackageName());
        active = true;
        running = true;
        startVoskOrFallback();
    }

    // ---- Motor offline (Vosk): reconhece português sem internet e sem depender do app do Google ----

    private org.vosk.Model voskModel;
    private org.vosk.android.SpeechService voskService;
    private boolean usingVosk = false;
    private boolean voskDone = false;

    private void startVoskOrFallback() {
        try {
            org.vosk.android.StorageService.unpack(this, "model-pt", "model",
                    (org.vosk.Model model) -> {
                        if (!active) { model.close(); return; }
                        voskModel = model;
                        startVosk();
                    },
                    (java.io.IOException e) -> fallbackToAndroid("Voz offline indisponível, usando a do Android."));
        } catch (Throwable t) {
            fallbackToAndroid("Voz offline indisponível, usando a do Android.");
        }
    }

    private void startVosk() {
        try {
            org.vosk.Recognizer rec = new org.vosk.Recognizer(voskModel, 16000.0f);
            voskService = new org.vosk.android.SpeechService(rec, 16000.0f);
            voskService.startListening(voskListener);
            usingVosk = true;
            status("Ouvindo (offline). Diga “Nino” e a ordem.");
        } catch (Throwable t) {
            fallbackToAndroid("Voz offline falhou, usando a do Android.");
        }
    }

    private void fallbackToAndroid(String why) {
        if (!active) return;
        usingVosk = false;
        if (!SpeechRecognizer.isRecognitionAvailable(this)) {
            status("Sem reconhecimento de voz neste aparelho.");
            stopSelf();
            return;
        }
        status(why);
        h.post(this::startRec);
    }

    private static String jsonText(String json, String key) {
        try { return new org.json.JSONObject(json).optString(key, ""); } catch (org.json.JSONException e) { return ""; }
    }

    private final org.vosk.android.RecognitionListener voskListener = new org.vosk.android.RecognitionListener() {
        @Override public void onPartialResult(String hypothesis) {
            final String t = jsonText(hypothesis, "partial");
            if (t.isEmpty() || voskDone) return;
            if (NinoVoice.isBusy()) {
                // Interromper o Nino enquanto ele fala: "Nino, para" / "Nino, chega" (frase curta, para não se confundir com a própria voz).
                final String tt = t;
                h.post(new Runnable() { @Override public void run() {
                    String n = Normalizer.normalize(tt, Normalizer.Form.NFD).replaceAll("\\p{M}+", "").toLowerCase(Locale.ROOT);
                    if (WAKE.matcher(n).find() && n.trim().split("\\s+").length <= 4
                            && n.matches(".*\\b(para|pare|chega|silencio|cala|calma)\\b.*")) {
                        NinoVoice.stop();
                        turn++; // descarta o resto da resposta que ainda está chegando
                        voskDone = true;
                        FloatingNinoService.say("Tá bom, parei! 🤐", false);
                    }
                } });
                return;
            }
            h.post(new Runnable() { @Override public void run() {
                if (!voskDone && tryPartial(java.util.Collections.singletonList(t))) voskDone = true;
            } });
        }
        @Override public void onResult(String hypothesis) { finish(jsonText(hypothesis, "text")); }
        @Override public void onFinalResult(String hypothesis) { finish(jsonText(hypothesis, "text")); }
        private void finish(final String t) {
            h.post(new Runnable() { @Override public void run() {
                boolean already = voskDone;
                voskDone = false;
                if (already || t.isEmpty() || NinoVoice.isBusy()) return;
                handleFinal(java.util.Collections.singletonList(t));
            } });
        }
        @Override public void onError(Exception e) { h.post(new Runnable() { @Override public void run() { fallbackToAndroid("Voz offline parou, usando a do Android."); } }); }
        @Override public void onTimeout() { }
    };

    private void startRec() {
        if (!active || usingVosk) return;
        handledPartial = false;
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
        @Override
        public void onPartialResults(Bundle partialResults) {
            if (handledPartial || NinoVoice.isBusy()) return;
            ArrayList<String> list = partialResults.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
            if (list != null && tryPartial(list)) {
                handledPartial = true;
                resetRecognizer();
                h.removeCallbacks(restart);
                h.postDelayed(restart, 400);
            }
        }
        @Override public void onEvent(int eventType, Bundle params) { }

        @Override
        public void onResults(Bundle results) {
            errors = 0;
            if (handledPartial) return;
            if (NinoVoice.isBusy()) { // não ouvir a própria voz do Nino
                h.postDelayed(ListeningService.this::startRec, 500);
                return;
            }
            ArrayList<String> list = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
            if (list != null) handleFinal(list);
            h.postDelayed(ListeningService.this::startRec, 250);
        }

        @Override
        public void onError(int error) {
            if (!active || handledPartial) return;
            if (error != SpeechRecognizer.ERROR_NO_MATCH && error != SpeechRecognizer.ERROR_SPEECH_TIMEOUT) {
                status("Problema ao ouvir (código " + error + "). Tentando de novo…");
            }
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

    /** "Nino + ordem conhecida" já apareceu no meio da frase? Então obedece na hora. */
    private boolean tryPartial(java.util.List<String> list) {
        for (String candidate : list) {
            String command = extractCommand(candidate);
            if (command != null && !WAKE_ONLY.equals(command)
                    && overlayCommand(command) != null) {
                awaitUntil = 0;
                heard(command);
                deliver(command);
                return true;
            }
        }
        return false;
    }

    /** Frase completa ouvida (por qualquer motor de voz): obedece, responde ou espera a ordem. */
    private void handleFinal(java.util.List<String> list) {
            if (list != null) {
                boolean following = System.currentTimeMillis() < awaitUntil;
                boolean handled = false;
                for (String candidate : list) {
                    String command = extractCommand(candidate);
                    if (command != null) {
                        handled = true;
                        heard(WAKE_ONLY.equals(command) ? "Nino" : command);
                        if (WAKE_ONLY.equals(command)) {
                            // Só chamou: Nino acena e espera a ordem na próxima frase.
                            awaitUntil = System.currentTimeMillis() + 8000;
                            FloatingNinoService.perform("wave", false);
                            if (!FloatingNinoService.say("Oi! Pode falar.", true)) {
                                NinoVoice.speak(ListeningService.this, "Oi! Pode falar.");
                            }
                        } else {
                            awaitUntil = 0;
                            deliver(command);
                        }
                        break;
                    }
                }
                if (!handled && following && !list.isEmpty()) {
                    // Frase seguinte ao chamado: se tem uma ordem conhecida, obedece.
                    String first = list.get(0);
                    if (first != null && !first.trim().isEmpty()
                            && (overlayCommand(first) != null || first.trim().split("\\s+").length >= 2)) {
                        awaitUntil = 0;
                        heard(first);
                        deliver(first);
                    }
                }
            }
    }

    private String lastStatus = "";

    private void status(String text) {
        if (text.equals(lastStatus)) return;
        lastStatus = text;
        try {
            NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
            nm.notify(2, buildListenNotification(text));
        } catch (RuntimeException ignored) { }
    }

    /** Mostra na notificação o que o Nino ouviu por último (ajuda a ver se a voz está chegando). */
    private void heard(String text) {
        status("Ouvi: “" + text + "”");
    }

    /** Procura "Nino" na frase e devolve o que veio depois (ou "Oi, Nino!" se só chamou). */
    static String extractCommand(String heard) {
        if (heard == null) return null;
        String norm = Normalizer.normalize(heard, Normalizer.Form.NFD).replaceAll("\\p{M}+", "").toLowerCase(Locale.ROOT);
        Matcher m = WAKE.matcher(norm);
        if (!m.find()) return null;
        int end = Math.min(m.end(), heard.length());
        String rest = heard.substring(end).replaceAll("^[\\s,.!?:;-]+", "").trim();
        return rest.isEmpty() ? WAKE_ONLY : rest;
    }

    /** Ordem simples para o Nino que está sobre outros apps (null se não for uma ordem). */
    static String overlayCommand(String command) {
        String n = Normalizer.normalize(command, Normalizer.Form.NFD).replaceAll("\\p{M}+", "")
                .toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9 ]+", " ").trim();
        // Só frases curtas são ordens ("anda pra direita"); frases longas vão para a conversa com a IA.
        if (n.split("\\s+").length > 5) return null;
        boolean right = P_RIGHT.matcher(n).find();
        boolean left = P_LEFT.matcher(n).find();
        if (right || left) {
            String side = right ? "right" : "left";
            return (P_RUN.matcher(n).find() ? "run_" : "walk_") + side;
        }
        if (P_FLIP.matcher(n).find()) return "backflip";
        if (P_JUMP.matcher(n).find()) return "jump";
        if (P_SPIN.matcher(n).find()) return "spin";
        if (P_DANCE.matcher(n).find()) return "dance";
        if (P_WAVE.matcher(n).find()) return "wave";
        if (P_SIT.matcher(n).find()) return "sit";
        if (P_SLEEP.matcher(n).find()) return "sleep";
        if (P_CLAP.matcher(n).find()) return "clap";
        if (P_FLEX.matcher(n).find()) return "flex";
        if (P_BOW.matcher(n).find()) return "bow";
        if (P_LAUGH.matcher(n).find()) return "laugh";
        if (P_CRY.matcher(n).find()) return "cry";
        if (P_ANGRY.matcher(n).find()) return "angry";
        if (P_LOVE.matcher(n).find()) return "love";
        if (P_THINK.matcher(n).find()) return "think";
        if (P_STOP.matcher(n).find()) return "stop";
        if (P_WALK.matcher(n).find()) return "walk";
        return null;
    }

    private static final String[] MESES = {"janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho",
            "agosto", "setembro", "outubro", "novembro", "dezembro"};
    private static final String[] DIAS = {"domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira",
            "sexta-feira", "sábado"};
    private static final String[] PIADAS = {
            "Por que o computador foi ao médico? Porque estava com vírus!",
            "O que o zero disse pro oito? Belo cinto!",
            "Qual é o cúmulo da velocidade? Fechar a porta do elevador e ir pelas escadas.",
            "Por que o livro de matemática ficou triste? Porque tinha muitos problemas."};

    /** Respostas rápidas que o Nino dá sozinho, sem abrir o app (null se não souber). */
    private String localReply(String text) {
        String n = Normalizer.normalize(text, Normalizer.Form.NFD).replaceAll("\\p{M}+", "")
                .toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9 ]+", " ");
        java.util.Calendar c = java.util.Calendar.getInstance();
        java.util.Random r = new java.util.Random();
        if (n.matches(".*\\b(que horas|horas sao|hora e|me diga a hora)\\b.*")) {
            int m = c.get(java.util.Calendar.MINUTE);
            return "São " + c.get(java.util.Calendar.HOUR_OF_DAY) + (m == 0 ? " horas em ponto." : " e " + m + ".");
        }
        if (n.matches(".*\\b(que dia|qual a data|data de hoje|dia e hoje|dia da semana)\\b.*")) {
            return "Hoje é " + DIAS[c.get(java.util.Calendar.DAY_OF_WEEK) - 1] + ", dia "
                    + c.get(java.util.Calendar.DAY_OF_MONTH) + " de " + MESES[c.get(java.util.Calendar.MONTH)] + ".";
        }
        if (n.matches(".*\\b(tudo bem|como voce esta|como vai voce|como voce ta|ta tudo bem)\\b.*")) {
            String[] o = {"Tudo ótimo por aqui!", "Estou bem, e você?", "Feliz da vida, pixelzinho!"};
            return o[r.nextInt(o.length)];
        }
        if (n.matches(".*\\b(seu nome|quem e voce|quem voce e|como voce se chama)\\b.*")) {
            return "Eu sou o Nino, seu agente aqui na tela!";
        }
        if (n.matches(".*\\b(obrigad[oa]|valeu|brigad[oa])\\b.*")) return "De nada! Estou aqui pra isso.";
        if (n.matches(".*\\b(piada|me faz rir|conta uma)\\b.*")) return PIADAS[r.nextInt(PIADAS.length)];
        if (n.matches(".*\\b(te amo|amo voce|gosto de voce)\\b.*")) return "Awn, eu também gosto muito de você!";
        if (n.matches(".*\\b(bom dia|boa tarde|boa noite|oi|ola|e ai|eai|salve)\\b.*")) {
            String[] o = {"Oi! Como posso ajudar?", "E aí! Tudo bem?", "Olá, humano!"};
            return o[r.nextInt(o.length)];
        }
        return null;
    }

    /** Abre o app com a frase. Sem permissão de sobreposição, mostra uma notificação para tocar. */
    private void deliver(final String command) {
        // 0) Superpoderes no aparelho: abrir apps, lanterna, volume, bateria, timer, notificações.
        String action = DeviceActions.handle(this, command);
        if (action != null) { respond(action); return; }
        // 1) Ordem de movimento/animação: o Nino da tela obedece na hora.
        String order = overlayCommand(command);
        if (order != null) {
            if (FloatingNinoService.perform(order, true)) { followUp(command); return; }
            respond("Ative o Nino na tela para eu obedecer!");
            return;
        }
        // 2) Respostas rápidas que ele sabe sozinho.
        String reply = localReply(command);
        if (reply != null) { respond(reply); return; }
        // 3) Conversa com a IA em segundo plano, com memória da conversa; fala cada frase assim que chega.
        FloatingNinoService.say("Hmm, deixa eu ver... 🤔", false);
        history.add(new String[] {"user", command});
        while (history.size() > 8) history.remove(0);
        final long myTurn = ++turn;
        NinoAi.ask(new java.util.ArrayList<>(history), new NinoAi.Callback() {
            @Override public void onSentence(String sentence) {
                if (!active || myTurn != turn) return; // outra pergunta/interrupção já começou
                speakPart(sentence);
            }
            @Override public void onDone(String fullText) {
                if (!active) return;
                history.add(new String[] {"assistant", fullText});
                while (history.size() > 8) history.remove(0);
                followUp(fullText);
            }
            @Override public void onError(String message) {
                if (!active) return;
                history.remove(history.size() - 1);
                respond(message);
            }
        });
    }

    private final java.util.ArrayList<String[]> history = new java.util.ArrayList<>();
    private int turn = 0;

    /** Uma frase da resposta: balão + voz, sem cortar a frase anterior. */
    private void speakPart(String sentence) {
        if (!FloatingNinoService.say(sentence, true)) NinoVoice.speak(this, sentence);
    }

    /** Mostra o balão e fala em voz alta; depois fica ouvindo a próxima frase sem precisar dizer "Nino". */
    private void respond(String text) {
        if (!FloatingNinoService.say(text, true)) NinoVoice.speak(this, text);
        followUp(text);
    }

    /** Modo conversa (como no ChatGPT por voz): logo após responder, a próxima frase vale sem dizer "Nino". */
    private void followUp(String spoken) {
        awaitUntil = System.currentTimeMillis() + 9000 + Math.min(spoken.length(), 400) * 70L;
    }

    private Notification buildListenNotification(String text) {
        PendingIntent open = PendingIntent.getActivity(this, 0, new Intent(this, MainActivity.class), PendingIntent.FLAG_IMMUTABLE);
        PendingIntent stop = PendingIntent.getService(this, 2,
                new Intent(this, ListeningService.class).setAction(ACTION_STOP), PendingIntent.FLAG_IMMUTABLE);
        return new NotificationCompat.Builder(this, CH_LISTEN)
                .setContentTitle("Nino está ouvindo")
                .setContentText(text)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentIntent(open)
                .addAction(0, "Parar", stop)
                .setOngoing(true)
                .setOnlyAlertOnce(true)
                .build();
    }

    private void startAsForeground() {
        NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            nm.createNotificationChannel(new NotificationChannel(CH_LISTEN, "Nino ouvindo", NotificationManager.IMPORTANCE_LOW));
        }
        Notification n = buildListenNotification("Diga “Nino” e a ordem. Toque em Parar para desligar.");
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
        if (voskService != null) {
            try { voskService.stop(); voskService.shutdown(); } catch (Throwable ignored) { }
            voskService = null;
        }
        if (voskModel != null) {
            try { voskModel.close(); } catch (Throwable ignored) { }
            voskModel = null;
        }
        super.onDestroy();
    }
}
