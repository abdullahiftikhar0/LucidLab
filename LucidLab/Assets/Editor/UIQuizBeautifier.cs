using UnityEngine;
using UnityEditor;
using UnityEngine.UI;
using TMPro;

public class UIQuizBeautifier : MonoBehaviour
{
    [MenuItem("Tools/Beautify Quiz UI")]
    public static void Beautify()
    {
        Sprite uiSprite = AssetDatabase.GetBuiltinExtraResource<Sprite>("UI/Skin/UISprite.psd");

        Color primaryBtnColor = new Color(0.1f, 0.14f, 0.22f, 0.95f); // Dark Slate Blue
        Color textColor = Color.white;
        Color panelColor = new Color(0.95f, 0.95f, 0.97f, 1f); // Off-white
        Color darkTextColor = new Color(0.1f, 0.1f, 0.1f, 1f);

        GameObject bgPanelObj = GameObject.Find("BackgroundPanel");
        if (bgPanelObj == null) return;

        // 1. Make BackgroundPanel a full-screen invisible container
        RectTransform bgRT = bgPanelObj.GetComponent<RectTransform>();
        bgRT.anchorMin = Vector2.zero;
        bgRT.anchorMax = Vector2.one;
        bgRT.offsetMin = Vector2.zero;
        bgRT.offsetMax = Vector2.zero;
        Image bgImg = bgPanelObj.GetComponent<Image>();
        if (bgImg != null) bgImg.color = new Color(0, 0, 0, 0); // Transparent

        // 2. Create the actual Dialog Box
        GameObject dialogObj = GameObject.Find("DialogBox");
        if (dialogObj == null)
        {
            dialogObj = new GameObject("DialogBox");
            dialogObj.transform.SetParent(bgPanelObj.transform, false);
            dialogObj.transform.SetSiblingIndex(0); // Put it at the back
            Image dialogImg = dialogObj.AddComponent<Image>();
            dialogImg.sprite = uiSprite;
            dialogImg.type = Image.Type.Sliced;
            dialogImg.color = panelColor;
        }

        RectTransform dialogRT = dialogObj.GetComponent<RectTransform>();
        // Bottom-Stretch anchor
        dialogRT.anchorMin = new Vector2(0, 0);
        dialogRT.anchorMax = new Vector2(1, 0);
        dialogRT.pivot = new Vector2(0.5f, 0);
        dialogRT.anchoredPosition = new Vector2(0, 40); // 40px from bottom
        dialogRT.sizeDelta = new Vector2(-40, 200); // 20px margin on left/right, 200 height

        // 3. Move and style QuestionText
        GameObject questionObj = GameObject.Find("QuestionText");
        if (questionObj != null)
        {
            questionObj.transform.SetParent(dialogObj.transform, true);
            RectTransform qRT = questionObj.GetComponent<RectTransform>();
            qRT.anchorMin = new Vector2(0, 1);
            qRT.anchorMax = new Vector2(1, 1);
            qRT.pivot = new Vector2(0.5f, 1);
            qRT.anchoredPosition = new Vector2(0, -20);
            qRT.sizeDelta = new Vector2(-60, 80);

            TextMeshProUGUI txt = questionObj.GetComponent<TextMeshProUGUI>();
            if (txt != null)
            {
                txt.color = darkTextColor;
                txt.fontStyle = FontStyles.Bold;
                txt.fontSizeMax = 32;
                txt.enableAutoSizing = true;
                txt.enableWordWrapping = true;
                txt.alignment = TextAlignmentOptions.Center;
            }
        }

        // 4. Move and style Answer Buttons
        string[] ansNames = new string[] { "AnswerBtn1", "AnswerBtn2", "AnswerBtn3" };
        for (int i = 0; i < ansNames.Length; i++)
        {
            GameObject btnObj = GameObject.Find(ansNames[i]);
            if (btnObj != null)
            {
                btnObj.transform.SetParent(dialogObj.transform, true);
                StyleButton(btnObj, uiSprite, primaryBtnColor, textColor);

                RectTransform rt = btnObj.GetComponent<RectTransform>();
                // Horizontal stack in thirds
                float startX = i / 3.0f;
                float endX = (i + 1) / 3.0f;
                rt.anchorMin = new Vector2(startX, 0);
                rt.anchorMax = new Vector2(endX, 0);
                rt.pivot = new Vector2(0.5f, 0);
                
                rt.anchoredPosition = new Vector2(0, 30); // 30px from bottom of dialog
                rt.sizeDelta = new Vector2(-20, 65); // 10px margin on left/right of each third, 65 height

                TextMeshProUGUI txt = btnObj.GetComponentInChildren<TextMeshProUGUI>();
                if (txt != null)
                {
                    txt.fontStyle = FontStyles.Bold;
                    txt.fontSizeMax = 22; // Slightly smaller to ensure fit
                    txt.enableAutoSizing = true;
                    txt.enableWordWrapping = true;
                    txt.margin = new Vector4(5, 5, 5, 5); // Tighter margins to maximize space
                    txt.alignment = TextAlignmentOptions.Center;
                }
            }
        }

        Debug.Log("Quiz UI Beautification Complete!");
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