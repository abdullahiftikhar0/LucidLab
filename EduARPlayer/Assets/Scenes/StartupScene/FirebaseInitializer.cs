using System;
using Firebase;
using Firebase.Extensions;
using UnityEngine;

/// <summary>
/// Initialises Firebase on the Unity/Android main thread.
/// Must be placed in the first scene (StartupScene) on a GameObject with
/// "Execute in Awake" priority over StartupScript.
/// Uses ContinueWithOnMainThread instead of await so the JNI class loader
/// is always accessed from the correct thread, preventing the SIGABRT crash
/// (obj == null in CallObjectMethodV) seen on Android 16 with SDK 10.7.0.
/// </summary>
public class FirebaseInitializer : MonoBehaviour
{
    // ── Singleton ──────────────────────────────────────────────────────────
    public static FirebaseInitializer Instance { get; private set; }

    // ── State (polled by StartupScript) ───────────────────────────────────
    public bool  IsReady    { get; private set; }
    public bool  HasFailed  { get; private set; }
    public string InitError { get; private set; }

    // ── Unity lifecycle ───────────────────────────────────────────────────
    private void Awake()
    {
        // Enforce singleton + survive scene loads
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }
        Instance = this;
        DontDestroyOnLoad(gameObject);

        BeginFirebaseInit();
    }

    // ── Firebase init ─────────────────────────────────────────────────────
    private void BeginFirebaseInit()
    {
        Debug.Log("[FirebaseInitializer] Starting Firebase dependency check...");

        // ContinueWithOnMainThread guarantees the continuation runs on the
        // Unity main thread, which is the thread whose JNIEnv has the correct
        // Android class loader attached. Using plain ContinueWith (or await on
        // Android) can schedule the continuation on a thread-pool thread where
        // the class loader is absent, resulting in obj==null SIGABRT.
        FirebaseApp.CheckAndFixDependenciesAsync()
            .ContinueWithOnMainThread(task =>
            {
                try
                {
                    if (task.IsFaulted || task.IsCanceled)
                    {
                        var msg = task.IsFaulted
                            ? task.Exception?.Flatten().Message ?? "unknown error"
                            : "task was cancelled";
                        Fail($"Dependency check faulted: {msg}");
                        return;
                    }

                    var status = task.Result;
                    Debug.Log($"[FirebaseInitializer] Dependency status: {status}");

                    if (status != DependencyStatus.Available)
                    {
                        Fail($"Firebase dependencies unavailable: {status}");
                        return;
                    }

                    // Verify the app instance exists
                    var app = FirebaseApp.DefaultInstance;
                    if (app == null)
                    {
                        Fail("FirebaseApp.DefaultInstance is null after init.");
                        return;
                    }

                    Debug.Log("[FirebaseInitializer] Firebase ready.");
                    IsReady = true;
                }
                catch (Exception ex)
                {
                    Fail($"Exception during Firebase init: {ex.Message}");
                }
            });
    }

    private void Fail(string reason)
    {
        Debug.LogError($"[FirebaseInitializer] FAILED — {reason}");
        InitError = reason;
        HasFailed = true;
    }
}
