using Assets.Structures;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;

public class ObjectManagement : MonoBehaviour
{
    Dictionary<string, SceneObject> sceneObjsDict = new();

    /// <summary>Used by PlayMode to resolve objects when running scene logic.</summary>
    public SceneObject GetSceneObject(string objectName)
    {
        return sceneObjsDict.TryGetValue(objectName, out var obj) ? obj : null;
    }

    /// <summary>
    /// Resolve a scene object name from a hit GameObject by checking the object
    /// and its parent chain against known logical scene object keys.
    /// </summary>
    public string ResolveSceneObjectName(GameObject hitObject)
    {
        var current = hitObject != null ? hitObject.transform : null;
        while (current != null)
        {
            if (sceneObjsDict.ContainsKey(current.name))
            {
                return current.name;
            }
            current = current.parent;
        }
        return null;
    }

    class SetModelObjectParams {
        public string objectModelName;
        public string objURL;
    }
    void SetModelObject(string input) {
        var obj = JsonUtility.FromJson<SetModelObjectParams>(input);
        ModelDownloader.objLinks[obj.objectModelName] = obj.objURL;
        Debug.Log($"Set model of type {obj.objectModelName} to {obj.objURL}.");
    }

    void CreateObject(string objectJson) {
        var obj = JsonUtility.FromJson<SceneObject>(objectJson);
        
        // If object already exists, dispose it first to ensure a clean sync
        if (sceneObjsDict.TryGetValue(obj.objectName, out var existing)) {
            existing.Dispose();
            sceneObjsDict.Remove(obj.objectName);
        }

        if (sceneObjsDict.TryAdd(obj.objectName, obj)) {
            obj.InitGameobject();
        }
    }

    void DeleteObject(string objectName) {
        if (sceneObjsDict.TryGetValue(objectName, out var obj)) {
            obj.Dispose();
            sceneObjsDict.Remove(objectName);
        }
    }

    class PositionParams
    {
        public string objectName;
        public float x;
        public float y;
        public float z;
    }
    void SetObjectPosition(string input)
    {
        var objData = JsonUtility.FromJson<PositionParams>(input);
        if (sceneObjsDict.TryGetValue(objData.objectName, out var obj)) {
            obj.position = new List<float>() { objData.x, objData.y, objData.z };
            obj.UpdatePosition();
        }
    }
    void SetObjectRotation(string input) {
        var objData = JsonUtility.FromJson<PositionParams>(input);
        if (sceneObjsDict.TryGetValue(objData.objectName, out var obj)) {
            obj.rotation = new List<float>() { objData.x, objData.y, objData.z };
            obj.UpdateRotation();
        }
    }
    void SetObjectScale(string input) {
        var objData = JsonUtility.FromJson<PositionParams>(input);
        if (sceneObjsDict.TryGetValue(objData.objectName, out var obj)) {
            obj.scale = new List<float>() { objData.x, objData.y, objData.z };
            obj.UpdateScale();
        }
    }

    class SetObjectCollorParams {
        public string objectName;
        public string color;
    }
    void SetObjectColor(string input) {
        var objData = JsonUtility.FromJson<SetObjectCollorParams>(input);
        if (sceneObjsDict.TryGetValue(objData.objectName, out var obj)) {
            obj.color = objData.color;
            obj.UpdateColor();
        }
    }

    /*private void Start()
    {
        ModelDownloader.objLinks.Add("truck", "https://firebasestorage.googleapis.com/v0/b/eduvr-fd56d.appspot.com/o/objectTypes%2Fmainuser%2Fthe%20truck.glb?alt=media&token=e30044ae-5a80-4a01-b987-82bf5cf8c62d");
        CreateObject("{\"objectName\":\"fhfgh\",\"objectType\":\"truck\",\"position\":[0,0.28,0],\"rotation\":[0,0,0],\"scale\":[0.08,0.08,0.08],\"hasGravity\":false,\"isGrabbable\":true}");
    }*/
}
