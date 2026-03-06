using UnityEditor;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using Assets.Interaction;

public class BuildARToggleUI {
    [MenuItem("Tools/Build AR Toggle UI")]
    public static void BuildUI() {
        var canvas = GameObject.Find("Canvas");
        if (canvas == null) {
            Debug.LogError("Canvas not found!");
            return;
        }

        // 1. Background (Pill)
        GameObject bgGo = new GameObject("ARToggleBackground", typeof(RectTransform), typeof(CanvasRenderer), typeof(Image), typeof(Button), typeof(TrackingModeToggleUI));
        bgGo.transform.SetParent(canvas.transform, false);
        var bgRt = bgGo.GetComponent<RectTransform>();
        bgRt.anchorMin = new Vector2(0, 1);
        bgRt.anchorMax = new Vector2(0, 1);             
        bgRt.pivot = new Vector2(0, 1);
        bgRt.anchoredPosition = new Vector2(30, -30);
        bgRt.sizeDelta = new Vector2(160, 70);

        var bgImg = bgGo.GetComponent<Image>();
        bgImg.color = new Color(0.15f, 0.15f, 0.18f); // Dark grey/blue background
        bgImg.sprite = AssetDatabase.GetBuiltinExtraResource<Sprite>("UI/Skin/Background.psd");
        bgImg.type = Image.Type.Sliced;

        // 2. Text
        GameObject textGo = new GameObject("ToggleText", typeof(RectTransform), typeof(CanvasRenderer), typeof(TextMeshProUGUI));
        textGo.transform.SetParent(bgGo.transform, false);
        var txtRt = textGo.GetComponent<RectTransform>();
        txtRt.anchorMin = new Vector2(0.5f, 0.5f);
        txtRt.anchorMax = new Vector2(0.5f, 0.5f);
        txtRt.pivot = new Vector2(0.5f, 0.5f);
        txtRt.sizeDelta = new Vector2(100, 50);
        
        var txt = textGo.GetComponent<TextMeshProUGUI>();
        txt.fontSize = 24;
        txt.fontStyle = FontStyles.Bold;
        txt.alignment = TextAlignmentOptions.Center;
        txt.text = "MARKER";

        // 3. Knob Background
        GameObject knobGo = new GameObject("ToggleKnob", typeof(RectTransform), typeof(CanvasRenderer), typeof(Image));
        knobGo.transform.SetParent(bgGo.transform, false);
        var knobRt = knobGo.GetComponent<RectTransform>();
        knobRt.anchorMin = new Vector2(0.5f, 0.5f);
        knobRt.anchorMax = new Vector2(0.5f, 0.5f);
        knobRt.pivot = new Vector2(0.5f, 0.5f);
        knobRt.sizeDelta = new Vector2(70, 70); // Circle

        var knobImg = knobGo.GetComponent<Image>();
        knobImg.color = new Color(0.1f, 0.1f, 0.12f); // Very dark circle
        knobImg.sprite = AssetDatabase.GetBuiltinExtraResource<Sprite>("UI/Skin/Knob.psd"); // Builtin circle sprite

        // 4. Knob Inner Glow (Colored Circle)
        GameObject innerGo = new GameObject("KnobInner", typeof(RectTransform), typeof(CanvasRenderer), typeof(Image));
        innerGo.transform.SetParent(knobGo.transform, false);
        var innerRt = innerGo.GetComponent<RectTransform>();
        innerRt.anchorMin = new Vector2(0.5f, 0.5f);
        innerRt.anchorMax = new Vector2(0.5f, 0.5f);
        innerRt.pivot = new Vector2(0.5f, 0.5f);
        innerRt.sizeDelta = new Vector2(30, 30); // Smaller circle

        var innerImg = innerGo.GetComponent<Image>();
        innerImg.sprite = AssetDatabase.GetBuiltinExtraResource<Sprite>("UI/Skin/Knob.psd");
        
        // 5. Wire up script
        var toggleScript = bgGo.GetComponent<TrackingModeToggleUI>();
        toggleScript.background = bgImg;
        toggleScript.knob = knobRt;
        toggleScript.knobInnerGlow = innerImg;
        toggleScript.statusText = txt;

        // Set dimensions for the knob positions
        toggleScript.knobLeftX = -45f;
        toggleScript.knobRightX = 45f;

        EditorUtility.SetDirty(bgGo);
        UnityEditor.SceneManagement.EditorSceneManager.SaveScene(canvas.scene);
        Debug.Log("AR Toggle UI Created Successfully!");
    }
}
