package app.lovable.ninoai;

import android.app.Notification;
import android.content.ComponentName;
import android.content.Context;
import android.content.pm.PackageManager;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import androidx.core.app.NotificationManagerCompat;
import java.util.ArrayList;
import java.util.List;

/**
 * Guarda na memória (nunca em disco nem na internet) as últimas notificações do celular, para o Nino lê-las
 * em voz alta quando você pedir. Só funciona se você liberar "Acesso às notificações" para o Nino.
 */
public class NinoNotificationListener extends NotificationListenerService {
    private static final int MAX = 15;
    private static final List<String[]> recent = new ArrayList<>(); // {app, título, texto}

    static boolean enabled(Context ctx) {
        return NotificationManagerCompat.getEnabledListenerPackages(ctx).contains(ctx.getPackageName());
    }

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        try {
            if (sbn == null || getPackageName().equals(sbn.getPackageName())) return;
            Notification n = sbn.getNotification();
            if (n == null || (n.flags & Notification.FLAG_ONGOING_EVENT) != 0 || (n.flags & Notification.FLAG_GROUP_SUMMARY) != 0) return;
            CharSequence title = n.extras.getCharSequence(Notification.EXTRA_TITLE);
            CharSequence text = n.extras.getCharSequence(Notification.EXTRA_TEXT);
            if (title == null && text == null) return;
            String app = sbn.getPackageName();
            try {
                PackageManager pm = getPackageManager();
                app = String.valueOf(pm.getApplicationLabel(pm.getApplicationInfo(sbn.getPackageName(), 0)));
            } catch (PackageManager.NameNotFoundException ignored) { }
            synchronized (recent) {
                recent.add(0, new String[] {app, String.valueOf(title == null ? "" : title), String.valueOf(text == null ? "" : text)});
                while (recent.size() > MAX) recent.remove(recent.size() - 1);
            }
        } catch (RuntimeException ignored) { }
    }

    @Override
    public void onListenerConnected() {
        super.onListenerConnected();
        try { // já mostra o que está na barra agora
            StatusBarNotification[] active = getActiveNotifications();
            if (active != null) for (StatusBarNotification s : active) onNotificationPosted(s);
        } catch (RuntimeException ignored) { }
    }

    /** Resumo falado das últimas notificações (até 4). */
    static String summary(Context ctx) {
        if (!enabled(ctx)) {
            return "Para eu ler suas notificações, libere o acesso às notificações na aba Permissões do app.";
        }
        synchronized (recent) {
            if (recent.isEmpty()) return "Você não tem notificações novas.";
            StringBuilder sb = new StringBuilder();
            int shown = Math.min(4, recent.size());
            sb.append("Você tem ").append(recent.size()).append(recent.size() == 1 ? " notificação. " : " notificações. ");
            for (int i = 0; i < shown; i++) {
                String[] r = recent.get(i);
                sb.append(r[0]).append(": ");
                if (!r[1].isEmpty()) sb.append(r[1]);
                if (!r[2].isEmpty()) sb.append(r[1].isEmpty() ? "" : ", ").append(r[2].length() > 90 ? r[2].substring(0, 90) : r[2]);
                sb.append(". ");
            }
            return sb.toString().trim();
        }
    }
}
