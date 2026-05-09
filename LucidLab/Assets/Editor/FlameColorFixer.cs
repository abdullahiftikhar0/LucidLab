using UnityEngine;
using UnityEditor;

public class FlameColorFixer : MonoBehaviour
{
    [MenuItem("Tools/Fix Flame Colors")]
    public static void FixFlames()
    {
        string[] fireNames = new string[] { "CaFire", "BaFire", "SrFire", "CuFire", "KFire", "NaFire" };
        
        foreach (string name in fireNames)
        {
            GameObject fireObj = GameObject.Find(name);
            if (fireObj != null)
            {
                ParticleSystem ps = fireObj.GetComponent<ParticleSystem>();
                if (ps != null)
                {
                    var col = ps.colorOverLifetime;
                    
                    Gradient grad = new Gradient();
                    grad.SetKeys(
                        new GradientColorKey[] { new GradientColorKey(Color.white, 0.0f), new GradientColorKey(Color.white, 1.0f) },
                        new GradientAlphaKey[] { new GradientAlphaKey(1.0f, 0.0f), new GradientAlphaKey(1.0f, 0.7f), new GradientAlphaKey(0.0f, 1.0f) }
                    );
                    
                    col.color = grad;
                    Debug.Log("Fixed color gradient for " + name);
                    
                    // Also ensure the start colors are correct and vivid
                    var main = ps.main;
                    if (name == "CaFire") main.startColor = new Color(1.0f, 0.27f, 0.0f); // Brick Red
                    if (name == "BaFire") main.startColor = new Color(0.55f, 0.71f, 0.0f); // Apple Green
                    if (name == "SrFire") main.startColor = new Color(0.86f, 0.08f, 0.23f); // Crimson
                    if (name == "CuFire") main.startColor = new Color(0.0f, 0.8f, 0.8f); // Blue-Green
                    if (name == "KFire")  main.startColor = new Color(0.78f, 0.63f, 0.78f); // Lilac
                    if (name == "NaFire") main.startColor = new Color(1.0f, 1.0f, 0.0f); // Intense Yellow
                }
            }
        }
    }
}