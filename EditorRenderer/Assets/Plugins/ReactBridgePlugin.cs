using System.Runtime.InteropServices;

public static class ReactBridge
{
#if UNITY_WEBGL && !UNITY_EDITOR
    [DllImport("__Internal")]
    public static extern void SendObjectSelected(string objectName);
    [DllImport("__Internal")]
    public static extern void SendShowMessage(string message);
#else
    public static void SendObjectSelected(string objectName)
    {
        UnityEngine.Debug.Log($"[ReactBridge Mock] ObjectSelected: '{objectName}'");
    }
    public static void SendShowMessage(string message)
    {
        UnityEngine.Debug.Log($"[ReactBridge Mock] ShowMessage: '{message}'");
    }
#endif
}
