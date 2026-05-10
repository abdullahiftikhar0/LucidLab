using UnityEngine;

public class ForceHorizontal : MonoBehaviour
{
    void Awake()
    {
        // Force the screen to landscape
        Screen.orientation = ScreenOrientation.LandscapeLeft;
        Debug.Log("AtomicReaction: Orientation set to Landscape.");
    }

    void OnDestroy()
    {
        // Reset to AutoRotation when leaving the scene
        Screen.orientation = ScreenOrientation.AutoRotation;
        Debug.Log("AtomicReaction: Orientation reset to AutoRotation.");
    }
}