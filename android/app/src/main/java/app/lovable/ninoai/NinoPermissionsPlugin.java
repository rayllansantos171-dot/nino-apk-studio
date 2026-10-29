package app.lovable.ninoai;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;
import androidx.core.app.NotificationManagerCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

/** Mostra o estado real de cada permissão do app e pede cada uma pela aba "Permissões". */
@CapacitorPlugin(
        name = "NinoPermissions",
        permissions = {
            @Permission(strings = {Manifest.permission.RECORD_AUDIO}, alias = "mic"),
            @Permission(strings = {Manifest.permission.CAMERA}, alias = "camera"),
            @Permission(strings = {Manifest.permission.POST_NOTIFICATIONS}, alias = "notif")
        })
public class NinoPermissionsPlugin extends Plugin {

    private String pkg() { return getContext().getPackageName(); }

    private boolean notificationsOn() {
        return NotificationManagerCompat.from(getContext()).areNotificationsEnabled();
    }

    private boolean overlayOn() {
        return Build.VERSION.SDK_INT < Build.VERSION_CODES.M || Settings.canDrawOverlays(getContext());
    }

    private boolean batteryFree() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return true;
        PowerManager pm = (PowerManager) getContext().getSystemService(Context.POWER_SERVICE);
        return pm != null && pm.isIgnoringBatteryOptimizations(pkg());
    }

    private JSObject snapshot() {
        JSObject r = new JSObject();
        r.put("internet", true);   // permissão normal: já vem concedida na instalação
        r.put("overlay", overlayOn());
        r.put("notifications", notificationsOn());
        r.put("microphone", getPermissionState("mic") == PermissionState.GRANTED);
        r.put("camera", getPermissionState("camera") == PermissionState.GRANTED);
        r.put("vibration", true);  // permissão normal: já vem concedida na instalação
        r.put("background", batteryFree());
        return r;
    }

    private void launch(Intent i) {
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            getContext().startActivity(i);
        } catch (RuntimeException e) {
            openAppSettings();
        }
    }

    private void openAppSettings() {
        Intent i = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + pkg()));
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            getContext().startActivity(i);
        } catch (RuntimeException ignored) { }
    }

    private void openNotificationSettings() {
        Intent i = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS);
        i.putExtra(Settings.EXTRA_APP_PACKAGE, pkg());
        launch(i);
    }

    @PluginMethod
    public void status(PluginCall call) {
        call.resolve(snapshot());
    }

    /**
     * Pede a permissão: mostra o aviso do Android; se a pessoa já negou de vez (o Android não mostra
     * mais o aviso), abre a tela de configurações do app para ela liberar ali.
     */
    @PluginMethod
    public void request(PluginCall call) {
        String name = call.getString("name", "");
        switch (name) {
            case "overlay":
                if (!overlayOn()) {
                    launch(new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:" + pkg())));
                }
                call.resolve(snapshot());
                break;
            case "background":
                if (!batteryFree()) {
                    launch(new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS, Uri.parse("package:" + pkg())));
                }
                call.resolve(snapshot());
                break;
            case "notifications":
                if (notificationsOn()) {
                    call.resolve(snapshot());
                } else if (Build.VERSION.SDK_INT >= 33) {
                    askRuntime(call, "notif");
                } else {
                    openNotificationSettings();
                    call.resolve(snapshot());
                }
                break;
            case "microphone":
                askRuntime(call, "mic");
                break;
            case "camera":
                askRuntime(call, "camera");
                break;
            default:
                call.resolve(snapshot());
        }
    }

    private void askRuntime(PluginCall call, String alias) {
        PermissionState st = getPermissionState(alias);
        if (st == PermissionState.GRANTED) {
            call.resolve(snapshot());
        } else if (st == PermissionState.DENIED) {
            // Já negada antes sem opção de perguntar de novo: só dá para liberar nas configurações do app.
            openAppSettings();
            call.resolve(snapshot());
        } else {
            requestPermissionForAlias(alias, call, "permResult");
        }
    }

    @PermissionCallback
    private void permResult(PluginCall call) {
        call.resolve(snapshot());
    }
}
