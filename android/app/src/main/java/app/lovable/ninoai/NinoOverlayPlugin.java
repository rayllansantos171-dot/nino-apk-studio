package app.lovable.ninoai;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Ponte JS -> nativo para ligar/desligar o Nino por cima de outros apps. */
@CapacitorPlugin(name = "NinoOverlay")
public class NinoOverlayPlugin extends Plugin {

    private boolean canDraw() {
        return Build.VERSION.SDK_INT < Build.VERSION_CODES.M || Settings.canDrawOverlays(getContext());
    }

    @PluginMethod
    public void hasPermission(PluginCall call) {
        JSObject r = new JSObject();
        r.put("granted", canDraw());
        call.resolve(r);
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        if (!canDraw()) {
            Intent i = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:" + getContext().getPackageName()));
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
        }
        call.resolve();
    }

    @PluginMethod
    public void start(PluginCall call) {
        if (!canDraw()) { call.reject("Permissão de sobreposição negada"); return; }
        // Android 13+: pede permissão para mostrar a notificação do Nino (o serviço funciona mesmo se negar).
        if (Build.VERSION.SDK_INT >= 33
                && getContext().checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
                && getActivity() != null) {
            getActivity().requestPermissions(new String[] {Manifest.permission.POST_NOTIFICATIONS}, 4210);
        }
        FloatingNinoService.setSkin(call.getString("skin", "padrao"));
        Intent i = new Intent(getContext(), FloatingNinoService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) getContext().startForegroundService(i);
        else getContext().startService(i);
        call.resolve();
    }

    @PluginMethod
    public void isRunning(PluginCall call) {
        JSObject r = new JSObject();
        r.put("running", FloatingNinoService.running);
        call.resolve(r);
    }

    @PluginMethod
    public void setSkin(PluginCall call) {
        FloatingNinoService.setSkin(call.getString("skin", "padrao"));
        call.resolve();
    }

    @PluginMethod
    public void stop(PluginCall call) {
        getContext().stopService(new Intent(getContext(), FloatingNinoService.class));
        call.resolve();
    }
}
