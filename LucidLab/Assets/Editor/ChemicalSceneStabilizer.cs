using UnityEngine;
using UnityEditor;
using TMPro;
using UnityEditor.SceneManagement;
using System.IO;
using System.Collections.Generic;

public class ChemicalSceneStabilizer : EditorWindow
{
    [MenuItem("LucidLab/Deep Stabilize All Scenes")]
    public static void DeepStabilize()
    {
        var scenes = EditorBuildSettings.scenes;
        foreach (var sceneEntry in scenes)
        {
            if (!sceneEntry.enabled) continue;
            StabilizeScene(sceneEntry.path);
        }
        
        CleanupXR();
    }

    [MenuItem("LucidLab/Stabilize Current Scene")]
    public static void StabilizeCurrent()
    {
        string path = EditorSceneManager.GetActiveScene().path;
        if (string.IsNullOrEmpty(path))
        {
            Debug.LogError("[LucidLab] No active scene to stabilize.");
            return;
        }
        StabilizeScene(path);
        CleanupXR();
    }

    private static void StabilizeScene(string scenePath)
    {
        Debug.Log($"[LucidLab] Stabilizing scene: {scenePath}");
        var scene = EditorSceneManager.OpenScene(scenePath, OpenSceneMode.Single);
        
        var allGOs = GameObject.FindObjectsOfType<GameObject>(true);
        int fixedCount = 0;
        int missingFixed = 0;

        foreach (var go in allGOs)
        {
            bool changed = false;
            bool isUnderCanvas = go.GetComponentInParent<Canvas>() != null;

            // 1. Remove truly missing scripts (broken references)
            int removedCount = GameObjectUtility.RemoveMonoBehavioursWithMissingScript(go);
            if (removedCount > 0)
            {
                Debug.LogWarning($"[LucidLab] Removed {removedCount} missing scripts from '{go.name}' at '{GetGameObjectPath(go)}'");
                
                // If it was a text object, try to restore the component
                if (go.name.Contains("Text") || go.name.Contains("TMP"))
                {
                    if (isUnderCanvas) go.AddComponent<TextMeshProUGUI>();
                    else go.AddComponent<TextMeshPro>();
                    missingFixed++;
                }
                changed = true;
            }

            // 2. Correct Component Types (3D vs UI)
            var tmp3D = go.GetComponent<TextMeshPro>();
            var tmpUI = go.GetComponent<TextMeshProUGUI>();

            if ((tmp3D != null && isUnderCanvas) || (tmpUI != null && !isUnderCanvas))
            {
                if (PrefabUtility.IsPartOfPrefabInstance(go))
                {
                    PrefabUtility.UnpackPrefabInstance(go, PrefabUnpackMode.Completely, InteractionMode.AutomatedAction);
                }

                if (tmp3D != null && isUnderCanvas)
                {
                    Debug.Log($"[LucidLab] Converting 3D TMP to UI TMP on '{go.name}'");
                    string text = tmp3D.text;
                    TMP_FontAsset font = tmp3D.font;
                    float fontSize = tmp3D.fontSize;
                    Color color = tmp3D.color;

                    DestroyImmediate(tmp3D, true);
                    var mr = go.GetComponent<MeshRenderer>();
                    if (mr != null) DestroyImmediate(mr, true);
                    var mf = go.GetComponent<MeshFilter>();
                    if (mf != null) DestroyImmediate(mf, true);

                    var newUI = go.AddComponent<TextMeshProUGUI>();
                    newUI.text = text;
                    newUI.font = font;
                    newUI.fontSize = fontSize;
                    newUI.color = color;
                    changed = true;
                }
                else if (tmpUI != null && !isUnderCanvas)
                {
                    Debug.Log($"[LucidLab] Converting UI TMP to 3D TMP on '{go.name}'");
                    string text = tmpUI.text;
                    TMP_FontAsset font = tmpUI.font;
                    float fontSize = tmpUI.fontSize;
                    Color color = tmpUI.color;

                    DestroyImmediate(tmpUI, true);
                    var cr = go.GetComponent<CanvasRenderer>();
                    if (cr != null) DestroyImmediate(cr, true);

                    var new3D = go.AddComponent<TextMeshPro>();
                    new3D.text = text;
                    new3D.font = font;
                    new3D.fontSize = fontSize;
                    new3D.color = color;
                    
                    if (go.GetComponent<MeshRenderer>() == null) go.AddComponent<MeshRenderer>();
                    if (go.GetComponent<MeshFilter>() == null) go.AddComponent<MeshFilter>();
                    changed = true;
                }
            }

            // 3. Cleanup conflicting renderers for remaining components
            var final3D = go.GetComponent<TextMeshPro>();
            if (final3D != null)
            {
                var cr = go.GetComponent<CanvasRenderer>();
                if (cr != null) { DestroyImmediate(cr, true); changed = true; }
                if (go.GetComponent<MeshRenderer>() == null) { go.AddComponent<MeshRenderer>(); changed = true; }
                if (go.GetComponent<MeshFilter>() == null) { go.AddComponent<MeshFilter>(); changed = true; }
            }

            var finalUI = go.GetComponent<TextMeshProUGUI>();
            if (finalUI != null)
            {
                if (go.GetComponent<CanvasRenderer>() == null) { go.AddComponent<CanvasRenderer>(); changed = true; }
                var mr = go.GetComponent<MeshRenderer>();
                if (mr != null) { DestroyImmediate(mr, true); changed = true; }
                var mf = go.GetComponent<MeshFilter>();
                if (mf != null) { DestroyImmediate(mf, true); changed = true; }
            }

            if (changed) fixedCount++;
        }

        if (fixedCount > 0)
        {
            EditorSceneManager.MarkSceneDirty(scene);
            EditorSceneManager.SaveScene(scene);
            Debug.Log($"[LucidLab] Stabilized {fixedCount} objects in '{scenePath}' ({missingFixed} missing scripts repaired).");
        }
    }

    private static void CleanupXR()
    {
        string tempDir = "Assets/XR/Temp";
        if (Directory.Exists(tempDir))
        {
            Directory.Delete(tempDir, true);
            if (File.Exists(tempDir + ".meta")) File.Delete(tempDir + ".meta");
            AssetDatabase.Refresh();
            Debug.Log("[LucidLab] Cleaned up Assets/XR/Temp directory.");
        }
    }

    private static string GetGameObjectPath(GameObject obj)
    {
        string path = "/" + obj.name;
        while (obj.transform.parent != null)
        {
            obj = obj.transform.parent.gameObject;
            path = "/" + obj.name + path;
        }
        return path;
    }
}
