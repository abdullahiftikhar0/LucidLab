using UnityEngine;
using UnityEditor;
using System.Collections.Generic;

/// <summary>
/// Emergency revert script to remove glTFast shaders from "Always Included Shaders"
/// to stop shader variant explosion and reclaim disk space.
/// </summary>
public class RevertGltfShadersFromGraphics
{
    private static readonly string[] ShadersToRemove = new[]
    {
        "glTF/PbrMetallicRoughness",
        "glTF/PbrSpecularGlossiness",
        "glTF/Unlit",
        "Universal Render Pipeline/Lit",
        "Universal Render Pipeline/Simple Lit",
        "Universal Render Pipeline/Unlit",
    };

    [MenuItem("Tools/LucidLab/EMERGENCY - Revert glTF Shaders")]
    public static void RemoveShaders()
    {
        var allAssets = AssetDatabase.LoadAllAssetsAtPath("ProjectSettings/GraphicsSettings.asset");
        if (allAssets == null || allAssets.Length == 0)
        {
            Debug.LogError("[RevertShaders] Could not load GraphicsSettings.asset");
            return;
        }

        var graphicsSettingsObj = allAssets[0];
        var so = new SerializedObject(graphicsSettingsObj);
        var alwaysIncluded = so.FindProperty("m_AlwaysIncludedShaders");

        if (alwaysIncluded == null)
        {
            Debug.LogError("[RevertShaders] Could not find 'm_AlwaysIncludedShaders' property.");
            return;
        }

        int removedCount = 0;
        List<string> shadersFound = new List<string>(ShadersToRemove);

        for (int i = alwaysIncluded.arraySize - 1; i >= 0; i--)
        {
            var prop = alwaysIncluded.GetArrayElementAtIndex(i);
            var shaderRef = prop.objectReferenceValue;
            if (shaderRef != null && shadersFound.Contains(shaderRef.name))
            {
                string shaderName = shaderRef.name;
                
                // Set to null first so the next deletion call actually removes the array element
                prop.objectReferenceValue = null;
                alwaysIncluded.DeleteArrayElementAtIndex(i);
                
                removedCount++;
                Debug.Log($"[RevertShaders] 🗑 Removed shader: '{shaderName}'");
            }
        }

        so.ApplyModifiedProperties();
        AssetDatabase.SaveAssets();

        Debug.Log($"[RevertShaders] Done! Removed {removedCount} shader(s) from Always Included Shaders.");
        EditorUtility.DisplayDialog(
            "Shaders Reverted",
            $"Successfully removed {removedCount} shader(s).\n\nIMPORTANT: Close Unity and delete your Library/ShaderCache folder to get your space back.",
            "OK"
        );
    }
}
