package pl.katarzynaekasicka.odgadnijflage;

import android.annotation.SuppressLint;
import android.app.AlertDialog;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.ViewGroup;
import android.webkit.ConsoleMessage;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.activity.ComponentActivity;
import androidx.activity.OnBackPressedCallback;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewClientCompat;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.Collections;

/** Offline, local-only WebView host. No JavaScript-to-Java interface or network permission. */
public final class MainActivity extends ComponentActivity {
    private static final String HOST = WebViewAssetLoader.DEFAULT_DOMAIN;
    private static final String START_URL = "https://" + HOST + "/assets/www/index.html";
    private FrameLayout root;
    private WebView webView;
    private boolean backPending;
    private boolean exitShowing;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        root = new FrameLayout(this);
        root.setBackgroundColor(Color.rgb(8, 5, 30));
        setContentView(root);
        WindowCompat.getInsetsController(getWindow(), root).setAppearanceLightStatusBars(false);
        WindowCompat.getInsetsController(getWindow(), root).setAppearanceLightNavigationBars(false);
        ViewCompat.setOnApplyWindowInsetsListener(root, (view, insets) -> {
            Insets safe = insets.getInsets(WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout());
            Insets ime = insets.getInsets(WindowInsetsCompat.Type.ime());
            view.setPadding(safe.left, safe.top, safe.right, Math.max(safe.bottom, ime.bottom));
            return insets;
        });
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override public void handleOnBackPressed() { handleGameBack(); }
        });
        createGame();
    }

    @SuppressLint("SetJavaScriptEnabled") // Only verified HTML packaged inside this APK is loaded.
    private void createGame() {
        root.removeAllViews();
        webView = new WebView(this);
        webView.setBackgroundColor(Color.rgb(8, 5, 30));
        webView.setOverScrollMode(WebView.OVER_SCROLL_NEVER);
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setSupportMultipleWindows(false);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();
        webView.setWebViewClient(new WebViewClientCompat() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if ("https".equals(uri.getScheme()) && HOST.equals(uri.getHost())) {
                    WebResourceResponse local = loader.shouldInterceptRequest(uri);
                    if (local != null) return local;
                }
                return new WebResourceResponse("text/plain", "UTF-8", 403, "Local content only",
                        Collections.emptyMap(), new ByteArrayInputStream("Blocked".getBytes(StandardCharsets.UTF_8)));
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                // Do not allow a local page to navigate to an external website, file, or intent.
                return !START_URL.equals(request.getUrl().toString());
            }
            @Override public void onReceivedError(WebView view, WebResourceRequest request, androidx.webkit.WebResourceErrorCompat error) {
                if (request.isForMainFrame()) showLoadError();
            }
            @Override public boolean onRenderProcessGone(WebView view, android.webkit.RenderProcessGoneDetail detail) {
                if (webView == view) { root.removeView(view); view.destroy(); webView = null; }
                showLoadError();
                return true;
            }
        });
        webView.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onConsoleMessage(ConsoleMessage message) {
                if (BuildConfig.DEBUG) android.util.Log.d("FlagGame", message.message());
                return true;
            }
        });
        root.addView(webView, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        webView.loadUrl(START_URL);
    }

    private void handleGameBack() {
        if (webView == null) { confirmExit(); return; }
        if (backPending || exitShowing) return;
        backPending = true;
        webView.evaluateJavascript("Boolean(window.AndroidGame && window.AndroidGame.back())", result -> {
            backPending = false;
            if (!"true".equals(result) && !isFinishing()) confirmExit();
        });
    }

    private void confirmExit() {
        if (exitShowing || isFinishing()) return;
        exitShowing = true;
        if (webView != null) webView.evaluateJavascript("window.AndroidGame && window.AndroidGame.pause()", null);
        new AlertDialog.Builder(this)
                .setTitle(R.string.close_title)
                .setMessage(R.string.close_message)
                .setNegativeButton(R.string.keep_playing, null)
                .setPositiveButton(R.string.close_game, (dialog, which) -> finish())
                .setOnDismissListener(dialog -> {
                    exitShowing = false;
                    if (webView != null && !isFinishing()) webView.evaluateJavascript("window.AndroidGame && window.AndroidGame.resume()", null);
                }).show();
    }

    private void showLoadError() {
        if (isFinishing()) return;
        root.removeAllViews();
        if (webView != null) { webView.destroy(); webView = null; }
        LinearLayout panel = new LinearLayout(this);
        panel.setOrientation(LinearLayout.VERTICAL);
        panel.setGravity(android.view.Gravity.CENTER);
        int padding = (int) (24 * getResources().getDisplayMetrics().density);
        panel.setPadding(padding, padding, padding, padding);
        TextView message = new TextView(this);
        message.setText(R.string.load_error);
        message.setTextColor(Color.WHITE);
        message.setTextSize(18);
        Button retry = new Button(this);
        retry.setText(R.string.retry);
        retry.setOnClickListener(view -> createGame());
        panel.addView(message); panel.addView(retry);
        root.addView(panel, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
    }

    @Override protected void onPause() {
        if (webView != null) {
            webView.evaluateJavascript("window.AndroidGame && window.AndroidGame.pause()", null);
            webView.onPause();
        }
        super.onPause();
    }
    @Override protected void onResume() {
        super.onResume();
        if (webView != null) {
            webView.onResume();
            webView.evaluateJavascript("window.AndroidGame && window.AndroidGame.resume()", null);
        }
    }
    @Override protected void onDestroy() {
        if (webView != null) { root.removeView(webView); webView.destroy(); webView = null; }
        super.onDestroy();
    }
}
