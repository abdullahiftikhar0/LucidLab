using UnityEngine;
using UnityEditor;
using UnityEngine.UI;
using TMPro;

public class UIBeautifier : MonoBehaviour
{
    [MenuItem("Tools/Beautify UI")]
    public static void Beautify()
    {
        Sprite uiSprite = AssetDatabase.GetBuiltinExtraResource<Sprite>("UI/Skin/UISprite.psd");
        if (uiSprite == null)
        {
            Debug.LogError("Could not find default UISprite");
            return;
        }

        Color btnColor = new Color(0.1f, 0.14f, 0.22f, 0.95f); // Sleek dark blue/grey
        Color textColor = Color.white;

        // 1. Handle MenutBtn -> BackBtn
        GameObject menuBtnObj = GameObject.Find("MenutBtn");
        if (menuBtnObj != null)
        {
            menuBtnObj.name = "BackBtn";
            StyleButton(menuBtnObj, uiSprite, btnColor, textColor);
            
            // Set text
            TextMeshProUGUI txt = menuBtnObj.GetComponentInChildren<TextMeshProUGUI>();
            if (txt != null)
            {
                txt.text = "Back";
                txt.fontStyle = FontStyles.Bold;
                txt.fontSizeMax = 28;
                txt.enableAutoSizing = true;
                txt.margin = new Vector4(10, 5, 10, 5);
                txt.alignment = TextAlignmentOptions.Center;
            }

            // Set anchors and size (Top Left)
            RectTransform rt = menuBtnObj.GetComponent<RectTransform>();
            rt.anchorMin = new Vector2(0, 1);
            rt.anchorMax = new Vector2(0, 1);
            rt.pivot = new Vector2(0, 1);
            rt.anchoredPosition = new Vector2(20, -20);
            rt.sizeDelta = new Vector2(140, 50);
        }

        // 2. Handle StartBtn
        GameObject startBtnObj = GameObject.Find("StartBtn");
        if (startBtnObj != null)
        {
            StyleButton(startBtnObj, uiSprite, btnColor, textColor);
            
            TextMeshProUGUI txt = startBtnObj.GetComponentInChildren<TextMeshProUGUI>();
            if (txt != null)
            {
                txt.fontStyle = FontStyles.Bold;
                txt.fontSizeMax = 28;
                txt.enableAutoSizing = true;
                txt.margin = new Vector4(10, 5, 10, 5);
                txt.alignment = TextAlignmentOptions.Center;
            }

            // Bottom Left
            RectTransform rt = startBtnObj.GetComponent<RectTransform>();
            rt.anchorMin = new Vector2(0, 0);
            rt.anchorMax = new Vector2(0, 0);
            rt.pivot = new Vector2(0, 0);
            rt.anchoredPosition = new Vector2(20, 20);
            rt.sizeDelta = new Vector2(160, 55);
        }

        // 3. Handle Chemical List (Ca, Ba, Sr, Cu, K, Na)
        string[] chemNames = new string[] { "CaBtn", "BaBtn", "SrBtn", "CuBtn", "KBtn", "NaBtn" };
        for (int i = 0; i < chemNames.Length; i++)
        {
            GameObject btnObj = GameObject.Find(chemNames[i]);
            if (btnObj != null)
            {
                // Unique color for chemical buttons to look a bit different? 
                // Let's use a slightly lighter slate blue for the list
                Color chemColor = new Color(0.18f, 0.22f, 0.32f, 0.9f); 
                StyleButton(btnObj, uiSprite, chemColor, textColor);

                TextMeshProUGUI txt = btnObj.GetComponentInChildren<TextMeshProUGUI>();
                if (txt != null)
                {
                    txt.fontStyle = FontStyles.Normal;
                    txt.fontSizeMax = 24;
                    txt.enableAutoSizing = true;
                    txt.enableWordWrapping = true;
                    txt.margin = new Vector4(15, 5, 15, 5);
                    txt.alignment = TextAlignmentOptions.Left; // Left align looks professional for lists
                }

                // Top Right Layout
                RectTransform rt = btnObj.GetComponent<RectTransform>();
                rt.anchorMin = new Vector2(1, 1);
                rt.anchorMax = new Vector2(1, 1);
                rt.pivot = new Vector2(1, 1);
                
                // Stack them cleanly with 60 unit intervals
                rt.anchoredPosition = new Vector2(-20, -20 - (i * 60)); 
                rt.sizeDelta = new Vector2(220, 50);
            }
        }
        
        Debug.Log("UI Beautification Complete!");
    }

    private static void StyleButton(GameObject obj, Sprite sprite, Color bgColor, Color txtColor)
    {
        Image img = obj.GetComponent<Image>();
        if (img != null)
        {
            img.sprite = sprite;
            img.type = Image.Type.Sliced;
            img.color = bgColor;
        }

        TextMeshProUGUI txt = obj.GetComponentInChildren<TextMeshProUGUI>();
        if (txt != null)
        {
            txt.color = txtColor;
        }
    }
}