using System.Collections;
using UnityEngine;
using UnityEngine.SceneManagement;
using LucidLab.UI;
#if UNITY_ANDROID && !UNITY_EDITOR
using UnityEngine.Android;
#endif

namespace LucidLab.UI
{
    public class LoginWebController : MonoBehaviour
    {
        public CanvasGroup loadingScreen;
        [Tooltip("Minimum seconds the splash screen is shown")]
        public float minSplashDuration = 3f;
        private WebViewObject webViewObject;

        // Persistent WebViewObject that survives scene loads
        private static WebViewObject _persistentWebView;
        // Route callbacks to whichever LoginWebController is currently active
        private static LoginWebController _activeController;

        // Splash → app loading state
        private bool _shellLoaded;

        private void Awake()
        {
            _activeController = this;

            RequestMicrophonePermissionAtStartup();

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

            _shellLoaded = false;

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
                    if (_activeController == null) return;

                    if (_activeController._shellLoaded) return;

                    _activeController._shellLoaded = true;
                    if (_persistentWebView != null)
                        _persistentWebView.SetVisibility(true);
                    if (_activeController.loadingScreen != null)
                        _activeController.StartCoroutine(_activeController.FadeOutLoader());

                    Debug.Log("[Splash] App shell loaded.");
                },
                transparent: true
            );

            // Wait for initialization
            while (!webViewObject.IsInitialized())
            {
                yield return null;
            }

            // Allow Android WebView getUserMedia audio capture. Without this, the
            // plugin denies PermissionRequest.RESOURCE_AUDIO_CAPTURE by default.
            webViewObject.SetMicrophoneAccess(true);

            webViewObject.SetMargins(0, 0, 0, 0);

                // Load student shell directly.
                // The shell manages splash/auth bootstrap internally, so we avoid showing splash twice.
                string appUrl = System.IO.Path.Combine(Application.streamingAssetsPath, "student_app.html");
                appUrl = appUrl.Replace("\\", "/");

#if UNITY_ANDROID && !UNITY_EDITOR
                webViewObject.LoadURL("file:///android_asset/student_app.html");
#else
                webViewObject.LoadURL("file://" + appUrl);
#endif
        }

        /// <summary>
        /// Prompt mic permission as early as possible so voice features in WebView
        /// can access the input device without failing silently.
        /// </summary>
        private void RequestMicrophonePermissionAtStartup()
        {
#if UNITY_ANDROID && !UNITY_EDITOR
            if (!Permission.HasUserAuthorizedPermission(Permission.Microphone))
            {
                Debug.Log("[Permissions] Requesting microphone permission at startup.");
                Permission.RequestUserPermission(Permission.Microphone);
            }
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
                // Parse experimentId for SceneLoader compatibility and SubmissionManager
                try {
                    var json = JsonUtility.FromJson<ArPayload>(payload);
                    if (!string.IsNullOrEmpty(json.experimentId))
                    {
                        PlayerPrefs.SetString("expname", json.experimentId);
                        PlayerPrefs.SetString("experimentId", json.experimentId);
                        PlayerPrefs.SetString("experimentTitle", string.IsNullOrEmpty(json.title) ? json.experimentId : json.title);
                    }
                    else if (!string.IsNullOrEmpty(json.title))
                    {
                        PlayerPrefs.SetString("experimentTitle", json.title);
                    }
                    if (!string.IsNullOrEmpty(json.classroomId))
                    {
                        PlayerPrefs.SetString("classroomId", json.classroomId);
                    }
                    var modelUser = !string.IsNullOrEmpty(json.modelUsername)
                        ? json.modelUsername
                        : json.instructorId;
                    if (!string.IsNullOrEmpty(modelUser))
                    {
                        PlayerPrefs.SetString("modelUsername", modelUser);
                        PlayerPrefs.SetString("designerUsername", modelUser);
                    }
                    if (!string.IsNullOrEmpty(json.instructorId))
                    {
                        PlayerPrefs.SetString("instructorId", json.instructorId);
                    }

                    if (!string.IsNullOrEmpty(json.initialSceneName))
                    {
                        PlayerPrefs.SetString("initialSceneName", json.initialSceneName);
                    }
                    else
                    {
                        PlayerPrefs.DeleteKey("initialSceneName");
                    }
                } catch {
                    PlayerPrefs.SetString("expname", payload);
                    PlayerPrefs.SetString("experimentId", payload);
                    PlayerPrefs.SetString("experimentTitle", payload);
                    PlayerPrefs.DeleteKey("initialSceneName");
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
            else if (msg.StartsWith("set_student_id:"))
            {
                PlayerPrefs.SetString("studentId", msg.Substring("set_student_id:".Length));
                PlayerPrefs.Save();
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
            public string classroomId;
            public string instructorId;
            public string modelUsername;
            public string initialSceneName;
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
