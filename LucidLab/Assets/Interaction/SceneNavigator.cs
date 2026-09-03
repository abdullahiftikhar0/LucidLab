using UnityEngine;

/// <summary>
/// Simple helper for UI buttons to load Unity scenes by name.
/// The back button in ARMainScene calls LoadScene("StartupScene") via the
/// serialized OnClick event — this is intercepted to always go to LoginScene
/// since StartupScene is no longer used.
/// </summary>
public class SceneNavigator : MonoBehaviour {
    public void LoadScene(string sceneName) {
        if (sceneName == "StartupScene") {
            sceneName = "LoginScene";
        }
        UnityEngine.SceneManagement.SceneManager.LoadScene(sceneName);
    }
}
