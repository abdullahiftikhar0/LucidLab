
using UnityEngine;
using UnityEngine.Playables;
using System.Collections.Generic;

public class FlameTimelineSync : MonoBehaviour
{
    [System.Serializable]
    public class TimelineFlamePair
    {
        public PlayableDirector director;
        public GameObject coloredFlame;
    }

    public GameObject defaultFlame;
    public List<TimelineFlamePair> pairs = new List<TimelineFlamePair>();

    void Update()
    {
        bool anyPlaying = false;
        foreach (var pair in pairs)
        {
            if (pair.director != null && pair.director.state == PlayState.Playing)
            {
                anyPlaying = true;
                if (defaultFlame != null) defaultFlame.SetActive(false);
                
                // Ensure only this colored flame is active
                foreach (var otherPair in pairs)
                {
                    if (otherPair.coloredFlame != null)
                        otherPair.coloredFlame.SetActive(otherPair == pair);
                }
                break; 
            }
        }

        // If no timeline is playing, return to default flame
        if (!anyPlaying)
        {
            if (defaultFlame != null && !defaultFlame.activeSelf)
            {
                defaultFlame.SetActive(true);
                foreach (var pair in pairs)
                {
                    if (pair.coloredFlame != null) pair.coloredFlame.SetActive(false);
                }
            }
        }
    }
}
