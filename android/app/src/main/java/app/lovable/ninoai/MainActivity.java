package app.lovable.ninoai;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NinoOverlayPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
