package app.lovable.ninoai;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

/** Ponte JS -> nativo para a escuta em segundo plano (só roda quando a pessoa liga). */
@CapacitorPlugin(
        name = "NinoListen",
        permissions = {@Permission(strings = {Manifest.permission.RECORD_AUDIO}, alias = "mic")})
public class NinoListenPlugin extends Plugin {
    static final String EXTRA_TEXT = "nino_voice_text";

    @Override
    public void load() {
        if (getActivity() != null) handleVoiceIntent(getActivity().getIntent());
    }

    @Override
    protected void handleOnNewIntent(Intent intent) {
        super.handleOnNewIntent(intent);
        handleVoiceIntent(intent);
    }

    /** Entrega ao app (JS) a frase que o serviço ouviu depois da palavra "Nino". */
    private void handleVoiceIntent(Intent intent) {
        if (intent == null) return;
        String text = intent.getStringExtra(EXTRA_TEXT);
        if (text == null || text.isEmpty()) return;
        intent.removeExtra(EXTRA_TEXT);
        JSObject data = new JSObject();
        data.put("text", text);
        notifyListeners("voiceCommand", data, true);
    }

    private boolean micGranted() {
        return getPermissionState("mic") == PermissionState.GRANTED;
    }

    @PluginMethod
    public void hasPermission(PluginCall call) {
        JSObject r = new JSObject();
        r.put("granted", micGranted());
        call.resolve(r);
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        if (micGranted()) {
            hasPermission(call);
            return;
        }
        requestPermissionForAlias("mic", call, "micPermissionCallback");
    }

    @PermissionCallback
    private void micPermissionCallback(PluginCall call) {
        hasPermission(call);
    }

    @PluginMethod
    public void start(PluginCall call) {
        if (!micGranted()) {
            call.reject("Permissão de microfone negada");
            return;
        }
        // Android 13+: a notificação "Nino está ouvindo" precisa de permissão para aparecer.
        if (Build.VERSION.SDK_INT >= 33
                && getContext().checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
                && getActivity() != null) {
            getActivity().requestPermissions(new String[] {Manifest.permission.POST_NOTIFICATIONS}, 4211);
        }
        Intent i = new Intent(getContext(), ListeningService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) getContext().startForegroundService(i);
        else getContext().startService(i);
        call.resolve();
    }

    /** Voz nativa do Nino: o WebView do Android quase nunca tem speechSynthesis. */
    @PluginMethod
    public void speak(PluginCall call) {
        String text = call.getString("text", "");
        NinoVoice.speak(getContext(), text);
        call.resolve();
    }

    @PluginMethod
    public void stopSpeaking(PluginCall call) {
        NinoVoice.stop();
        call.resolve();
    }

    @PluginMethod
    public void stop(PluginCall call) {
        getContext().stopService(new Intent(getContext(), ListeningService.class));
        call.resolve();
    }

    @PluginMethod
    public void isRunning(PluginCall call) {
        JSObject r = new JSObject();
        r.put("running", ListeningService.running);
        call.resolve(r);
    }
}
