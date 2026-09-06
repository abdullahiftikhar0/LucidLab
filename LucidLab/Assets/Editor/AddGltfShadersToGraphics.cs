using UnityEngine;
using UnityEditor;

/// <summary>
/// One-shot Editor script to add glTFast shaders to "Always Included Shaders"
/// in Project Settings > Graphics, so they survive Android/iOS builds.
/// Run via: Tools > LucidLab > Add glTF Shaders to Build
/// </summary>
public class AddGltfShadersToGraphics
{
    private static readonly string[] ShadersToInclude = new[]
    {
        // glTFast native shaders
        "glTF/PbrMetallicRoughness",
        "glTF/PbrSpecularGlossiness",
        "glTF/Unlit",

        // URP shaders (used by our fallback repair logic)
        "Universal Render Pipeline/Lit",
        "Universal Render Pipeline/Simple Lit",
        "Universal Render Pipeline/Unlit",
    };

    [MenuItem("Tools/LucidLab/Add glTF Shaders to Build")]
    public static void AddShaders()
    {
        // Load GraphicsSettings asset via SerializedObject directly
        var allAssets = AssetDatabase.LoadAllAssetsAtPath("ProjectSettings/GraphicsSettings.asset");
        if (allAssets == null || allAssets.Length == 0)
        {
            Debug.LogError("[AddGltfShaders] Could not load ProjectSettings/GraphicsSettings.asset");
            return;
        }

        var graphicsSettingsObj = allAssets[0];
        var so = new SerializedObject(graphicsSettingsObj);
        var alwaysIncluded = so.FindProperty("m_AlwaysIncludedShaders");

        if (alwaysIncluded == null)
        {
            Debug.LogError("[AddGltfShaders] Could not find 'm_AlwaysIncludedShaders' property in GraphicsSettings.");
            return;
        }

        int addedCount = 0;
        foreach (var shaderName in ShadersToInclude)
        {
            var shader = Shader.Find(shaderName);
            if (shader == null)
            {
                Debug.LogWarning($"[AddGltfShaders] Shader not found: '{shaderName}' — skipping. (May need glTFast installed)");
                continue;
            }

            // Check if it's already in the list
            bool alreadyIncluded = false;
            for (int i = 0; i < alwaysIncluded.arraySize; i++)
            {
                var existing = alwaysIncluded.GetArrayElementAtIndex(i).objectReferenceValue;
                if (existing == shader)
                {
                    alreadyIncluded = true;
                    break;
                }
            }

            if (alreadyIncluded)
            {
                Debug.Log($"[AddGltfShaders] Already included: '{shaderName}'");
                continue;
            }

            // Append to the list
            int newIndex = alwaysIncluded.arraySize;
            alwaysIncluded.InsertArrayElementAtIndex(newIndex);
            alwaysIncluded.GetArrayElementAtIndex(newIndex).objectReferenceValue = shader;
            addedCount++;
            Debug.Log($"[AddGltfShaders] ✅ Added shader: '{shaderName}'");
        }

        so.ApplyModifiedProperties();
        AssetDatabase.SaveAssets();

        Debug.Log($"[AddGltfShaders] Done! Added {addedCount} shader(s) to Always Included Shaders.");
        EditorUtility.DisplayDialog(
            "glTF Shaders Added",
            $"Successfully added {addedCount} shader(s) to Always Included Shaders.\n\nVerify in: Edit > Project Settings > Graphics > Always Included Shaders",
            "OK"
        );
    }
}
