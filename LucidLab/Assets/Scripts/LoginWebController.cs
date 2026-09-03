using System.Collections;
using UnityEngine;
using UnityEngine.SceneManagement;
using LucidLab.UI;

namespace LucidLab.UI
{
    public class LoginWebController : MonoBehaviour
    {
        public CanvasGroup loadingScreen;
        private WebViewObject webViewObject;

        // Persistent WebViewObject that survives scene loads
        private static WebViewObject _persistentWebView;
        // Route callbacks to whichever LoginWebController is currently active
        private static LoginWebController _activeController;

        private void Awake()
        {
            _activeController = this;

            // Ensure Firebase is initialized (was previously in StartupScene)
            if (FirebaseInitializer.Instance == null)
            {
                var go = new GameObject("FirebaseInitializer");
                go.AddComponent<FirebaseInitializer>();
            }
        }

        private IEnumerator Start()
        {
            // Reuse existing webview if we're returning from another scene
            if (_persistentWebView != null)
            {
                webViewObject = _persistentWebView;
                webViewObject.SetVisibility(true);
                webViewObject.SetMargins(0, 0, 0, 0);
                // Skip loading screen since the page is already loaded
                if (loadingScreen != null)
                {
                    loadingScreen.alpha = 0f;
                    loadingScreen.gameObject.SetActive(false);
                }
                yield break;
            }

            webViewObject = (new GameObject("WebViewObject")).AddComponent<WebViewObject>();
            DontDestroyOnLoad(webViewObject.gameObject);
            _persistentWebView = webViewObject;

            webViewObject.Init(
                cb: (msg) =>
                {
                    Debug.Log($"Callback from JS: {msg}");
                    if (_activeController != null)
                        _activeController.HandleJSMessage(msg);
                },
                err: (msg) => Debug.LogError($"WebView Error: {msg}"),
                httpErr: (msg) => Debug.LogError($"WebView HTTP Error: {msg}"),
                started: (msg) => Debug.Log($"WebView Started: {msg}"),
                hooked: (msg) => Debug.Log($"WebView Hooked: {msg}"),
                ld: (msg) =>
                {
                    Debug.Log($"WebView Loaded: {msg}");
                    if (_persistentWebView != null)
                        _persistentWebView.SetVisibility(true);
                    
                    if (_activeController != null && _activeController.loadingScreen != null) 
                    {
                        _activeController.StartCoroutine(_activeController.FadeOutLoader());
                    }
                },
                transparent: true
            );

            // Wait for initialization
            while (!webViewObject.IsInitialized())
            {
                yield return null;
            }

            webViewObject.SetMargins(0, 0, 0, 0);

            // Load the unified shell that handles login, signup, and all post-login screens
            string url = System.IO.Path.Combine(Application.streamingAssetsPath, "student_app.html");
            url = url.Replace("\\", "/");

#if UNITY_ANDROID && !UNITY_EDITOR
            webViewObject.LoadURL("file:///android_asset/student_app.html");
#else
            webViewObject.LoadURL("file://" + url);
#endif
        }

        private IEnumerator FadeOutLoader()
        {
            float duration = 0.5f;
            float startAlpha = loadingScreen.alpha;
            float time = 0;

            while (time < duration)
            {
                time += Time.deltaTime;
                loadingScreen.alpha = Mathf.Lerp(startAlpha, 0f, time / duration);
                yield return null;
            }
            
            loadingScreen.alpha = 0f;
            loadingScreen.gameObject.SetActive(false);
        }

        /// <summary>
        /// Navigate the shell to the home/app screens after successful authentication.
        /// </summary>
        public void NavigateToApp()
        {
            if (webViewObject != null)
            {
                webViewObject.EvaluateJS("navigate('home');");
            }
        }

        private void HandleJSMessage(string msg)
        {
            if (msg.StartsWith("start_ar:"))
            {
                string payload = msg.Substring("start_ar:".Length);
                Debug.Log($"[App] Starting AR for: {payload}");
                // Store experiment info so AR scene can load the right content
                PlayerPrefs.SetString("current_experiment", payload);
                // Parse experimentId for SceneLoader compatibility
                try {
                    var json = JsonUtility.FromJson<ArPayload>(payload);
                    if (!string.IsNullOrEmpty(json.experimentId))
                        PlayerPrefs.SetString("expname", json.experimentId);
                } catch {
                    PlayerPrefs.SetString("expname", payload);
                }
                PlayerPrefs.Save();
                // Hide webview instead of destroying it so we can restore it later
                if (_persistentWebView != null)
                    _persistentWebView.SetVisibility(false);
                SceneManager.LoadScene("ARMainScene");
            }
            else if (msg == "logout")
            {
                Debug.Log("[Auth] User logged out via Firebase");
            }
            else
            {
                Debug.Log($"[Shell] Unhandled message: {msg}");
            }
        }

        [System.Serializable]
        private class ArPayload {
            public string experimentId;
            public string title;
            public string mode;
        }

        private void OnDestroy()
        {
            // Clear active controller reference but do NOT destroy the
            // persistent webview — it survives across scene loads.
            if (_activeController == this)
                _activeController = null;
        }
    }
}
