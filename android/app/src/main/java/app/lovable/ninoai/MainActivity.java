package app.lovable.ninoai;

import android.graphics.Color;
import android.os.Bundle;
import android.view.View;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final int BG = Color.parseColor("#07040F");

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NinoOverlayPlugin.class);
        super.onCreate(savedInstanceState);
        setupInsets();
    }

    /**
     * No Android 15+ o app desenha por baixo das barras do sistema. Aqui o conteúdo recebe
     * margem das barras (e do teclado), então o Nino nunca fica escondido atrás delas.
     */
    private void setupInsets() {
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        View content = findViewById(android.R.id.content);
        content.setBackgroundColor(BG);

        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(getWindow(), content);
        controller.setAppearanceLightStatusBars(false);
        controller.setAppearanceLightNavigationBars(false);

        ViewCompat.setOnApplyWindowInsetsListener(content, (v, insets) -> {
            int types = WindowInsetsCompat.Type.systemBars()
                    | WindowInsetsCompat.Type.displayCutout()
                    | WindowInsetsCompat.Type.ime();
            Insets bars = insets.getInsets(types);
            v.setPadding(bars.left, bars.top, bars.right, bars.bottom);
            return WindowInsetsCompat.CONSUMED;
        });
        ViewCompat.requestApplyInsets(content);
    }
}
