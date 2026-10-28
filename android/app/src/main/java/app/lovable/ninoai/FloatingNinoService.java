package app.lovable.ninoai;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.graphics.PixelFormat;
import android.os.Build;
import android.os.IBinder;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import androidx.core.app.NotificationCompat;

/** Serviço que desenha o Nino por cima de outros aplicativos. */
public class FloatingNinoService extends Service {
    private static final String CHANNEL = "nino_overlay";
    private WindowManager wm;
    private View view;

    @Override public IBinder onBind(Intent intent) { return null; }

    @Override
    public void onCreate() {
        super.onCreate();
        startAsForeground();
        wm = (WindowManager) getSystemService(WINDOW_SERVICE);
        view = LayoutInflater.from(this).inflate(R.layout.floating_nino, null);

        int type = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                : WindowManager.LayoutParams.TYPE_PHONE;
        final WindowManager.LayoutParams lp = new WindowManager.LayoutParams(
                WindowManager.LayoutParams.WRAP_CONTENT, WindowManager.LayoutParams.WRAP_CONTENT,
                type, WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE, PixelFormat.TRANSLUCENT);
        lp.gravity = Gravity.TOP | Gravity.START;
        lp.x = 40; lp.y = 300;

        view.setOnTouchListener(new View.OnTouchListener() {
            int sx, sy; float tx, ty; long t0;
            @Override public boolean onTouch(View v, MotionEvent e) {
                switch (e.getAction()) {
                    case MotionEvent.ACTION_DOWN:
                        sx = lp.x; sy = lp.y; tx = e.getRawX(); ty = e.getRawY(); t0 = System.currentTimeMillis();
                        return true;
                    case MotionEvent.ACTION_MOVE:
                        lp.x = sx + (int) (e.getRawX() - tx);
                        lp.y = sy + (int) (e.getRawY() - ty);
                        wm.updateViewLayout(view, lp);
                        return true;
                    case MotionEvent.ACTION_UP:
                        boolean tap = Math.abs(e.getRawX() - tx) < 12 && Math.abs(e.getRawY() - ty) < 12
                                && System.currentTimeMillis() - t0 < 300;
                        if (tap) openApp();
                        return true;
                }
                return false;
            }
        });
        wm.addView(view, lp);
    }

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
        if (view != null) wm.removeView(view);
        super.onDestroy();
    }
}
