using System;
using System.Collections.Generic;

namespace Assets.PlayMode
{
    /// <summary>Same shape as LucidLab's SceneLogicData but without Firestore; used for JSON from React.</summary>
    [Serializable]
    public class SceneLogicData
    {
        public string name;
        public List<float> position;
        public Dictionary<string, string> controls;
        public Dictionary<string, string> execOutputs;
        public Dictionary<string, string> inputValues;
        public Dictionary<string, InputFromData> inputsFrom;
    }

    [Serializable]
    public class InputFromData
    {
        public string nodeId;
        public string outputName;
    }

    /// <summary>JsonUtility-compatible payload: array of nodes (no Dictionary at root).</summary>
    [Serializable]
    public class SceneLogicPayload
    {
        public NodeEntry[] nodes;
    }

    [Serializable]
    public class NodeEntry
    {
        public string id;
        public string name;
        public KeyVal[] controls;
        public KeyVal[] execOutputs;
        public KeyVal[] inputValues;
        public InputFromEntry[] inputsFrom;
    }

    [Serializable]
    public class KeyVal
    {
        public string key;
        public string value;
    }

    [Serializable]
    public class InputFromEntry
    {
        public string key;
        public string nodeId;
        public string outputName;
    }
}
