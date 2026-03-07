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

        private IEnumerator Start()
        {
            webViewObject = (new GameObject("WebViewObject")).AddComponent<WebViewObject>();
            webViewObject.Init(
                cb: (msg) =>
                {
                    Debug.Log($"Callback from JS: {msg}");
                    HandleJSMessage(msg);
                },
                err: (msg) => Debug.LogError($"WebView Error: {msg}"),
                httpErr: (msg) => Debug.LogError($"WebView HTTP Error: {msg}"),
                started: (msg) => Debug.Log($"WebView Started: {msg}"),
                hooked: (msg) => Debug.Log($"WebView Hooked: {msg}"),
                ld: (msg) =>
                {
                    Debug.Log($"WebView Loaded: {msg}");
                    webViewObject.SetVisibility(true);
                    
                    if (loadingScreen != null) 
                    {
                        StartCoroutine(FadeOutLoader());
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
                PlayerPrefs.Save();
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

        private void OnDestroy()
        {
            if (webViewObject != null)
                Destroy(webViewObject.gameObject);
        }
    }
}
