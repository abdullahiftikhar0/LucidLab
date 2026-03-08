using System;
using UnityEngine;

namespace Assets.PlayMode
{
    /// <summary>Static callback so logic instructions (e.g. ShowMessage) can send to React in WebGL.</summary>
    public static class PlayModeMessageBridge
    {
        public static Action<string> OnShowMessage;

        public static void ShowMessage(string message)
        {
            if (!string.IsNullOrEmpty(message))
                Debug.Log($"[PlayMode] ShowMessage: {message}");
            OnShowMessage?.Invoke(message ?? "");
            ReactBridge.SendShowMessage(message ?? "");
        }
    }
}
