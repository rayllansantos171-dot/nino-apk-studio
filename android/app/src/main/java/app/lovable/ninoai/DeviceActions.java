package app.lovable.ninoai;

import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.hardware.camera2.CameraAccessException;
import android.hardware.camera2.CameraCharacteristics;
import android.hardware.camera2.CameraManager;
import android.media.AudioManager;
import android.os.BatteryManager;
import android.provider.AlarmClock;
import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * "Superpoderes" do Nino no Android, só quando a pessoa pede por voz: abrir apps, lanterna, volume, bateria,
 * timer e ler notificações. Tudo roda no aparelho; nada disso é enviado para a internet.
 */
final class DeviceActions {
    private DeviceActions() { }

    private static final Pattern OPEN = Pattern.compile("^(?:por favor\\s+)?(abre|abrir|abra|inicia|iniciar)\\s+(?:o\\s+|a\\s+|os\\s+|as\\s+|app\\s+|aplicativo\\s+)*(.+)$");
    private static final Pattern TORCH_ON = Pattern.compile("\\b(liga|ligar|acende|acender|ativa|ativar)\\b.*\\blanterna\\b|\\blanterna\\b.*\\b(ligada|acesa)\\b");
    private static final Pattern TORCH_OFF = Pattern.compile("\\b(desliga|desligar|apaga|apagar|desativa|desativar)\\b.*\\blanterna\\b");
    private static final Pattern VOL_UP = Pattern.compile("\\b(aumenta|aumentar|sobe|subir|mais alto)\\b.*\\b(volume|som)\\b|\\b(volume|som)\\b.*\\b(mais alto|maior)\\b");
    private static final Pattern VOL_DOWN = Pattern.compile("\\b(abaixa|abaixar|diminui|diminuir|baixa|baixar|desce)\\b.*\\b(volume|som)\\b|\\b(volume|som)\\b.*\\b(mais baixo|menor)\\b");
    private static final Pattern BATTERY = Pattern.compile("\\b(bateria)\\b");
    private static final Pattern TIMER = Pattern.compile("\\b(timer|temporizador|cronometro|me (?:avisa|lembra|chama))\\b.*");
    private static final Pattern READ_NOTIF = Pattern.compile("\\b(le|ler|leia)\\b.*\\bnotificacoes?\\b|\\bnotificacoes?\\b.*\\b(le|ler|leia)\\b|\\bquais\\b.*\\bnotificacoes\\b|\\btenho\\b.*\\bnotificac");

    static String normalize(String t) {
        return Normalizer.normalize(t, Normalizer.Form.NFD).replaceAll("\\p{M}+", "").toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9 ]+", " ").replaceAll("\\s+", " ").trim();
    }

    /** Executa a ação pedida e devolve o que o Nino deve dizer; null se não for um pedido de ação do aparelho. */
    static String handle(Context ctx, String spoken) {
        String n = normalize(spoken);

        if (TORCH_OFF.matcher(n).find()) return torch(ctx, false);
        if (TORCH_ON.matcher(n).find()) return torch(ctx, true);
        if (VOL_UP.matcher(n).find()) return volume(ctx, AudioManager.ADJUST_RAISE, "Aumentei o volume.");
        if (VOL_DOWN.matcher(n).find()) return volume(ctx, AudioManager.ADJUST_LOWER, "Abaixei o volume.");
        if (BATTERY.matcher(n).find() && n.matches(".*\\b(quanto|nivel|como|qual|esta|ta)\\b.*")) return battery(ctx);
        if (READ_NOTIF.matcher(n).find()) return NinoNotificationListener.summary(ctx);
        if (TIMER.matcher(n).find()) {
            String r = timer(ctx, n);
            if (r != null) return r;
        }
        Matcher m = OPEN.matcher(n);
        if (m.find() && n.split(" ").length <= 6) return openApp(ctx, m.group(2));
        return null;
    }

    // ---- lanterna ----
    private static String torch(Context ctx, boolean on) {
        try {
            CameraManager cm = (CameraManager) ctx.getSystemService(Context.CAMERA_SERVICE);
            for (String id : cm.getCameraIdList()) {
                Boolean flash = cm.getCameraCharacteristics(id).get(CameraCharacteristics.FLASH_INFO_AVAILABLE);
                if (flash != null && flash) {
                    cm.setTorchMode(id, on);
                    return on ? "Lanterna ligada!" : "Lanterna desligada.";
                }
            }
            return "Este aparelho não tem lanterna.";
        } catch (CameraAccessException | RuntimeException e) {
            return "Não consegui mexer na lanterna agora.";
        }
    }

    // ---- volume ----
    private static String volume(Context ctx, int direction, String msg) {
        try {
            AudioManager am = (AudioManager) ctx.getSystemService(Context.AUDIO_SERVICE);
            for (int i = 0; i < 3; i++) am.adjustStreamVolume(AudioManager.STREAM_MUSIC, direction, i == 2 ? AudioManager.FLAG_SHOW_UI : 0);
            return msg;
        } catch (RuntimeException e) {
            return "Não consegui mudar o volume.";
        }
    }

    // ---- bateria ----
    private static String battery(Context ctx) {
        try {
            BatteryManager bm = (BatteryManager) ctx.getSystemService(Context.BATTERY_SERVICE);
            int pct = bm.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY);
            if (pct <= 0) return "Não consegui ler a bateria.";
            return "A bateria está em " + pct + " por cento" + (bm.isCharging() ? ", carregando." : ".");
        } catch (RuntimeException e) {
            return "Não consegui ler a bateria.";
        }
    }

    // ---- timer ----
    private static final String[] UNITS = {"zero", "um", "dois", "tres", "quatro", "cinco", "seis", "sete", "oito", "nove",
            "dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"};
    private static final String[] TENS = {"", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta"};

    /** Converte "cinco", "vinte e cinco", "15" ou "meia" em número (null se não achar). */
    static Integer parseNumber(String[] w, int[] pos) {
        int i = pos[0];
        if (i >= w.length) return null;
        String s = w[i];
        if (s.matches("\\d+")) { pos[0] = i + 1; return Integer.parseInt(s); }
        if (s.equals("meia") || s.equals("meio")) { pos[0] = i + 1; return -30; } // "meia hora" = 30 min
        if (s.equals("uma") || s.equals("duas")) { pos[0] = i + 1; return s.equals("uma") ? 1 : 2; }
        for (int u = 0; u < UNITS.length; u++) if (UNITS[u].equals(s)) { pos[0] = i + 1; return u; }
        for (int t = 2; t < TENS.length; t++) {
            if (TENS[t].equals(s)) {
                int v = t * 10;
                pos[0] = i + 1;
                if (i + 2 < w.length && w[i + 1].equals("e")) {
                    for (int u = 1; u < 10; u++) if (UNITS[u].equals(w[i + 2])) { v += u; pos[0] = i + 3; break; }
                }
                return v;
            }
        }
        return null;
    }

    private static String timer(Context ctx, String n) {
        String[] w = n.split(" ");
        long seconds = 0;
        for (int i = 0; i < w.length; i++) {
            int[] pos = {i};
            Integer num = parseNumber(w, pos);
            if (num == null || pos[0] >= w.length) continue;
            String unit = w[pos[0]];
            if (num == -30 && unit.startsWith("hora")) { seconds += 1800; break; }
            if (unit.startsWith("segundo")) seconds += num;
            else if (unit.startsWith("minuto")) seconds += num * 60L;
            else if (unit.startsWith("hora")) seconds += num * 3600L;
            else continue;
            i = pos[0];
        }
        if (seconds <= 0 || seconds > 24 * 3600) return null;
        try {
            Intent i = new Intent(AlarmClock.ACTION_SET_TIMER)
                    .putExtra(AlarmClock.EXTRA_LENGTH, (int) seconds)
                    .putExtra(AlarmClock.EXTRA_SKIP_UI, true)
                    .putExtra(AlarmClock.EXTRA_MESSAGE, "Nino")
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            ctx.startActivity(i);
        } catch (RuntimeException e) {
            return "Não consegui criar o timer.";
        }
        long min = seconds / 60, sec = seconds % 60;
        String txt = min > 0 ? min + (min == 1 ? " minuto" : " minutos") + (sec > 0 ? " e " + sec + " segundos" : "") : sec + " segundos";
        return "Timer de " + txt + " ligado!";
    }

    // ---- abrir apps ----
    private static String openApp(Context ctx, String wanted) {
        String target = wanted.replaceAll("\\b(por favor|pra mim|para mim|ai|agora)\\b", "").trim();
        if (target.isEmpty()) return null;
        PackageManager pm = ctx.getPackageManager();
        Intent main = new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER);
        List<ResolveInfo> apps = pm.queryIntentActivities(main, 0);
        ResolveInfo best = null;
        int bestScore = 0;
        for (ResolveInfo ri : apps) {
            String label = normalize(String.valueOf(ri.loadLabel(pm)));
            int score = 0;
            if (label.equals(target)) score = 100;
            else if (label.startsWith(target) || target.startsWith(label)) score = 80;
            else if (label.contains(target)) score = 60;
            else if (target.contains(label) && label.length() >= 4) score = 50;
            if (score > bestScore) { bestScore = score; best = ri; }
        }
        if (best == null || ctx.getPackageName().equals(best.activityInfo.packageName)) {
            return best == null ? "Não achei o app " + target + " no seu celular." : null;
        }
        Intent launch = pm.getLaunchIntentForPackage(best.activityInfo.packageName);
        if (launch == null) return "Não consegui abrir " + target + ".";
        try {
            launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            ctx.startActivity(launch);
            return "Abrindo " + best.loadLabel(pm) + "!";
        } catch (RuntimeException e) {
            return "O Android não deixou eu abrir " + target + " agora. Ative 'Sobrepor a outros apps'.";
        }
    }
}
