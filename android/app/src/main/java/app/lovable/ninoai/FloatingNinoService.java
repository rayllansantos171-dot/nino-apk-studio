package app.lovable.ninoai;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.widget.TextView;
import android.graphics.PixelFormat;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.provider.Settings;
import android.os.Looper;
import android.util.DisplayMetrics;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.webkit.WebView;
import androidx.core.app.NotificationCompat;
import java.util.Random;

/** Desenha o Nino animado andando por cima de outros aplicativos (funciona offline). */
public class FloatingNinoService extends Service {
    private static final String CHANNEL = "nino_overlay";
    private WindowManager wm;
    private View view;
    private WebView web;
    private WindowManager.LayoutParams lp;
    private final Handler h = new Handler(Looper.getMainLooper());
    private final Random rnd = new Random();
    private boolean dragging = false;
    private int dir = 1;
    private int walkSpeed = 4;
    private String state = "idle";
    private int stateTicks = 0;
    private float vy = 0;
    private TextView bubble;
    private WindowManager.LayoutParams blp;
    private long bubbleUntil = 0;
    private long lastTapAt = 0;
    private static final String[] CHATTER = {
            "Que dia lindo! ☀️", "Tô de olho em tudo por aqui 👀", "Me chama de Nino que eu obedeço!",
            "Já tomou água hoje? 💧", "Me arrasta pra onde quiser!", "Quer ver um pulo? Diga: Nino, pular!",
            "Hmm... o que será que tem aí nesse app?", "Tô aqui se precisar! 💜", "Sabia que eu danço? Diga: Nino, dançar!"};
    private int sizePx;      // largura da janela do Nino
    private int heightPx;    // altura da janela do Nino
    static volatile boolean running = false;
    private static volatile FloatingNinoService instance;
    private static volatile String skin = "padrao";

    /** Skin do Nino na tela ("padrao" ou "anjo"). Vale na hora se ele já está na tela. */
    static void setSkin(String value) {
        String clean = value == null ? "padrao" : value.replaceAll("[^a-z]", "");
        skin = clean.isEmpty() ? "padrao" : clean;
        final FloatingNinoService s = instance;
        if (s != null && s.web != null) {
            s.h.post(new Runnable() {
                @Override public void run() {
                    if (s.web != null) s.web.evaluateJavascript("window.setSkin&&setSkin('" + skin + "')", null);
                }
            });
        }
    }

    /** Faz o Nino sobre outros apps obedecer uma ordem de voz. Devolve false se ele não está na tela. */
    static boolean perform(final String cmd) { return perform(cmd, false); }

    static boolean perform(final String cmd, final boolean talk) {
        final FloatingNinoService s = instance;
        if (s == null || s.view == null) return false;
        s.h.post(new Runnable() { @Override public void run() { s.doCommand(cmd, talk); } });
        return true;
    }

    /** Mostra um balão de fala sobre o Nino (e fala em voz alta, se pedido). false se ele não está na tela. */
    static boolean say(final String text, final boolean speak) {
        final FloatingNinoService s = instance;
        if (s == null || s.view == null) return false;
        s.h.post(new Runnable() { @Override public void run() { s.showBubble(text, speak); } });
        return true;
    }

    private static String lineFor(String cmd) {
        switch (cmd) {
            case "jump": return "Pulando! 🦘";
            case "backflip": return "Olha essa cambalhota! 🤸";
            case "dance": return "Hora do show! 🎶";
            case "wave": return "Oi, oi! 👋";
            case "spin": return "Girando! 🌀";
            case "walk": return "Dando uma voltinha!";
            case "walk_left": return "Indo pra esquerda! ⬅️";
            case "walk_right": return "Indo pra direita! ➡️";
            case "run_left": return "Correndo pra esquerda!";
            case "run_right": return "Correndo pra direita!";
            case "stop": return "Parei! 🛑";
            default: return null;
        }
    }

    private void showBubble(String text, boolean speak) {
        if (bubble == null || view == null) return;
        bubble.setText(text);
        bubble.setVisibility(View.VISIBLE);
        bubbleUntil = System.currentTimeMillis() + 2600 + text.length() * 45L;
        positionBubble();
        if (speak) NinoVoice.speak(this, text);
    }

    private void positionBubble() {
        if (bubble == null || blp == null || view == null || bubble.getVisibility() != View.VISIBLE) return;
        bubble.measure(View.MeasureSpec.makeMeasureSpec(0, View.MeasureSpec.UNSPECIFIED),
                View.MeasureSpec.makeMeasureSpec(0, View.MeasureSpec.UNSPECIFIED));
        int bw = bubble.getMeasuredWidth(), bh = bubble.getMeasuredHeight();
        int x = lp.x + sizePx / 2 - bw / 2;
        x = Math.max(4, Math.min(screenW() - bw - 4, x));
        int y = lp.y - bh - 2;
        if (y < 0) y = lp.y + heightPx - 8;
        blp.x = x; blp.y = y;
        try { wm.updateViewLayout(bubble, blp); } catch (RuntimeException ignored) { }
    }

    private void buildBubble() {
        float d = getResources().getDisplayMetrics().density;
        bubble = new TextView(this);
        bubble.setTextColor(Color.WHITE);
        bubble.setTextSize(13);
        bubble.setMaxWidth((int) (230 * d));
        bubble.setPadding((int) (12 * d), (int) (8 * d), (int) (12 * d), (int) (8 * d));
        GradientDrawable bg = new GradientDrawable();
        bg.setColor(Color.parseColor("#EE1B1430"));
        bg.setStroke((int) (2 * d), Color.parseColor("#A855F7"));
        bg.setCornerRadius(14 * d);
        bubble.setBackground(bg);
        bubble.setVisibility(View.GONE);
        int type = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY : WindowManager.LayoutParams.TYPE_PHONE;
        blp = new WindowManager.LayoutParams(WindowManager.LayoutParams.WRAP_CONTENT,
                WindowManager.LayoutParams.WRAP_CONTENT, type,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE | WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE
                        | WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS, PixelFormat.TRANSLUCENT);
        blp.gravity = Gravity.TOP | Gravity.START;
        try { wm.addView(bubble, blp); } catch (RuntimeException e) { bubble = null; }
    }

    private int floorY() { return screenH() - heightPx - 120; }

    private void doCommand(String cmd, boolean talk) {
        if (view == null || dragging) return;
        String line = lineFor(cmd);
        if (line != null) showBubble(line, talk);
        switch (cmd) {
            case "jump":
                lp.y = Math.min(lp.y, floorY()) - 1; vy = -24; setState("jump"); stateTicks = 30; break;
            case "backflip":
                lp.y = Math.min(lp.y, floorY()) - 1; vy = -28; setState("backflip"); stateTicks = 30; break;
            case "dance": setState("dance"); stateTicks = 90; break;
            case "wave": setState("wave"); stateTicks = 60; break;
            case "spin": setState("spin"); stateTicks = 36; break;
            case "walk": if (rnd.nextBoolean()) dir = -dir; walkSpeed = 4; setState("walk"); stateTicks = 240; break;
            case "walk_left": dir = -1; walkSpeed = 4; setState("walk"); stateTicks = 90; break;
            case "walk_right": dir = 1; walkSpeed = 4; setState("walk"); stateTicks = 90; break;
            case "run_left": dir = -1; walkSpeed = 9; setState("walk"); stateTicks = 70; break;
            case "run_right": dir = 1; walkSpeed = 9; setState("walk"); stateTicks = 70; break;
            case "stop": setState("idle"); stateTicks = 200; break;
            default: break;
        }
    }

    @Override public IBinder onBind(Intent intent) { return null; }

    /** Se o sistema matar o serviço, ele não volta sozinho (a pessoa liga de novo pelo botão). */
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        return START_NOT_STICKY;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        instance = this;
        try {
            startAsForeground();
        } catch (RuntimeException e) {
            instance = null;
            stopSelf();
            return;
        }
        // Sem permissão de sobreposição (por exemplo, revogada nos ajustes) o serviço encerra sem travar o app.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(this)) {
            stopSelf();
            return;
        }
        wm = (WindowManager) getSystemService(WINDOW_SERVICE);
        view = LayoutInflater.from(this).inflate(R.layout.floating_nino, null);
        web = view.findViewById(R.id.nino_web);
        web.setBackgroundColor(Color.TRANSPARENT);
        web.getSettings().setJavaScriptEnabled(true);
        web.loadUrl("file:///android_asset/public/nino-overlay.html#" + skin);
        sizePx = (int) (110 * getResources().getDisplayMetrics().density);
        heightPx = (int) (150 * getResources().getDisplayMetrics().density);

        int type = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                : WindowManager.LayoutParams.TYPE_PHONE;
        lp = new WindowManager.LayoutParams(
                WindowManager.LayoutParams.WRAP_CONTENT, WindowManager.LayoutParams.WRAP_CONTENT,
                type, WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE | WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
                PixelFormat.TRANSLUCENT);
        lp.gravity = Gravity.TOP | Gravity.START;
        lp.x = 40; lp.y = screenH() - heightPx - 200;

        view.findViewById(R.id.nino_touch).setOnTouchListener(new View.OnTouchListener() {
            int sx, sy; float tx, ty; long t0;
            @Override public boolean onTouch(View v, MotionEvent e) {
                switch (e.getAction()) {
                    case MotionEvent.ACTION_DOWN:
                        dragging = true; setState("drag");
                        showBubble("Ei! 😮", false);
                        sx = lp.x; sy = lp.y; tx = e.getRawX(); ty = e.getRawY(); t0 = System.currentTimeMillis();
                        return true;
                    case MotionEvent.ACTION_MOVE:
                        lp.x = sx + (int) (e.getRawX() - tx);
                        lp.y = sy + (int) (e.getRawY() - ty);
                        updateLayoutSafe();
                        return true;
                    case MotionEvent.ACTION_CANCEL:
                        dragging = false; vy = 0; setState("idle");
                        return true;
                    case MotionEvent.ACTION_UP:
                        dragging = false; vy = 0;
                        boolean tap = Math.abs(e.getRawX() - tx) < 12 && Math.abs(e.getRawY() - ty) < 12
                                && System.currentTimeMillis() - t0 < 300;
                        if (tap) {
                            long now = System.currentTimeMillis();
                            setState("wave"); stateTicks = 40;
                            if (now - lastTapAt < 600) { lastTapAt = 0; openApp(); } // toque duplo abre o app
                            else { lastTapAt = now; showBubble("Oi! Toque duas vezes pra abrir o app 😄", false); }
                        } else setState("idle");
                        return true;
                }
                return false;
            }
        });
        try {
            wm.addView(view, lp);
        } catch (RuntimeException e) {
            view = null;
            stopSelf();
            return;
        }
        running = true;
        buildBubble();
        h.post(tick);
    }

    private int screenW() { DisplayMetrics m = getResources().getDisplayMetrics(); return m.widthPixels; }
    private int screenH() { DisplayMetrics m = getResources().getDisplayMetrics(); return m.heightPixels; }

    private void updateLayoutSafe() {
        if (view == null || wm == null) return;
        try { wm.updateViewLayout(view, lp); } catch (RuntimeException ignored) { }
    }

    private void setState(String s) {
        state = s;
        web.evaluateJavascript("window.setState&&setState('" + s + "'," + (dir < 0) + ")", null);
    }

    private final Runnable tick = new Runnable() {
        @Override public void run() {
            if (!dragging && view != null) {
                int floor = floorY();
                if (lp.y < floor) { // cai com gravidade
                    vy += 2.5f; lp.y = Math.min(floor, lp.y + (int) vy);
                    if (lp.y >= floor) { vy = 0; setState("jump"); stateTicks = 15; }
                } else {
                    if (--stateTicks <= 0) {
                        if (rnd.nextInt(6) == 0 && bubble != null && bubble.getVisibility() != View.VISIBLE) {
                            showBubble(CHATTER[rnd.nextInt(CHATTER.length)], false);
                        }
                        int r = rnd.nextInt(10);
                        if (r < 6) { if (rnd.nextBoolean()) dir = -dir; walkSpeed = 4; setState("walk"); stateTicks = 60 + rnd.nextInt(120); }
                        else if (r < 8) { setState("idle"); stateTicks = 40 + rnd.nextInt(80); }
                        else if (r < 9) { setState("wave"); stateTicks = 40; }
                        else { setState("jump"); stateTicks = 15; }
                    }
                    if ("walk".equals(state)) {
                        lp.x += dir * walkSpeed;
                        if (lp.x < 0) { lp.x = 0; dir = 1; setState("walk"); }
                        if (lp.x > screenW() - sizePx) { lp.x = screenW() - sizePx; dir = -1; setState("walk"); }
                    }
                }
                updateLayoutSafe();
                if (bubble != null && bubble.getVisibility() == View.VISIBLE) {
                    if (System.currentTimeMillis() > bubbleUntil) bubble.setVisibility(View.GONE);
                    else positionBubble();
                }
            }
            h.postDelayed(this, 33);
        }
    };

    private void openApp() {
        Intent i = new Intent(this, MainActivity.class);
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
        startActivity(i);
    }

    private void startAsForeground() {
        NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            nm.createNotificationChannel(new NotificationChannel(CHANNEL, "Nino na tela", NotificationManager.IMPORTANCE_LOW));
        }
        PendingIntent pi = PendingIntent.getActivity(this, 0, new Intent(this, MainActivity.class),
                PendingIntent.FLAG_IMMUTABLE);
        Notification n = new NotificationCompat.Builder(this, CHANNEL)
                .setContentTitle("Nino está na tela")
                .setContentText("Toque para abrir o Nino AI")
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentIntent(pi)
                .setOngoing(true)
                .build();
        if (Build.VERSION.SDK_INT >= 34) {
            startForeground(1, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
        } else {
            startForeground(1, n);
        }
    }

    @Override
    public void onDestroy() {
        running = false;
        if (instance == this) instance = null;
        h.removeCallbacks(tick);
        if (view != null && wm != null) {
            try { wm.removeView(view); } catch (RuntimeException ignored) { }
            view = null;
        }
        if (bubble != null && wm != null) {
            try { wm.removeView(bubble); } catch (RuntimeException ignored) { }
            bubble = null;
        }
        NinoVoice.stop();
        if (web != null) web.destroy();
        super.onDestroy();
    }
}
