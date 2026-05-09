using UnityEngine;

public class SceneOrientationManager : MonoBehaviour
{
    [SerializeField] private ScreenOrientation targetOrientation = ScreenOrientation.LandscapeLeft;
    
    // We assume the rest of the app should be AutoRotation as per ProjectSettings
    private const ScreenOrientation defaultOrientation = ScreenOrientation.AutoRotation;

    void Start()
    {
        ApplyOrientation(targetOrientation);
    }

    void OnDestroy()
    {
        ApplyOrientation(defaultOrientation);
    }

    private void ApplyOrientation(ScreenOrientation orientation)
    {
        Screen.orientation = orientation;
        Debug.Log($"[LucidLab] Setting screen orientation to: {orientation}");
    }
}
