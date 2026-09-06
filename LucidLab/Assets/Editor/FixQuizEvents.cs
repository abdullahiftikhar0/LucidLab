using UnityEngine;
using UnityEditor;
using UnityEngine.UI;
using UnityEngine.Events;
using UnityEditor.Events;

public class FixQuizEvents : MonoBehaviour
{
    [MenuItem("Tools/Fix Quiz Events and Layout")]
    public static void Fix()
    {
        GameObject mobileUI = GameObject.Find("Mobile UI");
        if (mobileUI == null) return;
        
        // Find BackBtn which might be inactive
        Transform backBtnTr = mobileUI.transform.Find("ChemicalButtons/BackBtn");
        if (backBtnTr != null)
        {
            GameObject backBtnObj = backBtnTr.gameObject;
            Button btn = backBtnObj.GetComponent<Button>();
            ChangeScene changeScene = backBtnObj.GetComponent<ChangeScene>();
            if (btn != null && changeScene != null)
            {
                // Clear existing listeners
                while (btn.onClick.GetPersistentEventCount() > 0)
                {
                    UnityEventTools.RemovePersistentListener(btn.onClick, 0);
                }
                
                // Add the ReturnToMain listener
                UnityAction methodDelegate = System.Delegate.CreateDelegate(typeof(UnityAction), changeScene, "ReturnToMain") as UnityAction;
                UnityEventTools.AddPersistentListener(btn.onClick, methodDelegate);
                Debug.Log("Wired BackBtn to ChangeScene.ReturnToMain");
            }
        }

        // 2. Fix ScorePanel and StopBtn Layout
        Transform dialogTr = mobileUI.transform.Find("BackgroundPanel/DialogBox");
        if (dialogTr != null)
        {
            GameObject dialogBox = dialogTr.gameObject;
            
            Transform scoreTr = mobileUI.transform.Find("BackgroundPanel/ScorePanel");
            if (scoreTr != null)
            {
                GameObject scorePanel = scoreTr.gameObject;
                scorePanel.transform.SetParent(dialogBox.transform, false); 
                // Timeline will push it, but let's set a good default
                RectTransform rt = scorePanel.GetComponent<RectTransform>();
                rt.anchorMin = new Vector2(0.5f, 1);
                rt.anchorMax = new Vector2(0.5f, 1);
                rt.pivot = new Vector2(0.5f, 1);
                rt.anchoredPosition = new Vector2(0, 150); // Floating above dialog box
            }

            Transform stopTr = mobileUI.transform.Find("BackgroundPanel/StopBtn");
            if (stopTr != null)
            {
                GameObject stopBtn = stopTr.gameObject;
                stopBtn.transform.SetParent(dialogBox.transform, false);
                RectTransform rt = stopBtn.GetComponent<RectTransform>();
                rt.anchorMin = new Vector2(0, 1);
                rt.anchorMax = new Vector2(0, 1);
                rt.pivot = new Vector2(0, 1);
                rt.anchoredPosition = new Vector2(20, 150); // Floating above dialog box on the left
            }
        }

        Debug.Log("Quiz Events and Layout Fixed!");
    }
}