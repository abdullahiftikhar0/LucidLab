using UnityEngine;
using RuntimeHandle;

public class ToolController : MonoBehaviour
{
    [System.Serializable]
    private class TransformSyncPayload
    {
        public string objectName;
        public float[] position;
        public float[] rotation;
        public float[] scale;
    }

    // These strings must exactly match the ToolMode enum in React
    public enum ToolMode
    {
        Hand,
        Move,
        Rotate,
        Scale,
        Rect,
        Transform
    }

    [SerializeField]
    public ToolMode currentTool = ToolMode.Hand;

    private string selectedObjectName = "";
    private ObjectManagement objectManager;
    private Camera mainCamera;
    private RuntimeTransformHandle runtimeHandle;
    private Vector3 lastSyncedPosition;
    private Vector3 lastSyncedRotation;
    private Vector3 lastSyncedScale;
    private bool hasSyncedTransform;

    private const float XSceneMin = -0.438f;
    private const float XSceneMax = 0.716f;
    private const float ZSceneMin = -0.017f;
    private const float ZSceneMax = -0.579f;
    private const float Precision = 1000f;
    private const float Epsilon = 0.0005f;

    void Start()
    {
        objectManager = GetComponent<ObjectManagement>();
        mainCamera = Camera.main;

        // Try to find an existing RuntimeTransformHandle in the scene; if not, create one
        runtimeHandle = FindObjectOfType<RuntimeTransformHandle>();
        if (runtimeHandle == null)
        {
            runtimeHandle = RuntimeTransformHandle.Create(null, HandleType.POSITION);
            runtimeHandle.gameObject.name = "RuntimeTransformHandle";
        }

        runtimeHandle.gameObject.SetActive(false);
    }

    /// <summary>
    /// Called from React via UnityContext.sendMessage("SceneController", "SetToolMode", "Move")
    /// </summary>
    public void SetToolMode(string modeString)
    {
        if (System.Enum.TryParse(modeString, out ToolMode newMode))
        {
            currentTool = newMode;
            Debug.Log($"[ToolController] Tool mode changed to: {currentTool}");
            SyncHandleMode();
        }
        else
        {
            Debug.LogWarning($"[ToolController] Unknown tool mode: {modeString}");
        }
    }

    void Update()
    {
        // Handle object selection via Raycast on left mouse click
        // Only allow selection if the mouse is not captured by a camera pan (which uses right/middle click typically, or we can just check if Hand tool is active, but selection is usually always allowed)
        if (Input.GetMouseButtonDown(0))
        {
            Ray ray = mainCamera.ScreenPointToRay(Input.mousePosition);
            if (Physics.Raycast(ray, out RaycastHit hit))
            {
                // If we clicked on a RuntimeTransformHandle gizmo, don't change selection
                var handleHit = hit.collider.gameObject.GetComponentInParent<HandleBase>();
                if (handleHit != null)
                {
                    return;
                }

                string hitObjectName = objectManager != null
                    ? objectManager.ResolveSceneObjectName(hit.collider.gameObject)
                    : null;
                
                // Exclude the ground from selection if needed, assuming ground has a specific name or layer
                if (!string.IsNullOrEmpty(hitObjectName) && hitObjectName != "Ground" && hitObjectName != "Plane") 
                {
                    SelectObject(hitObjectName);
                }
                else
                {
                    DeselectObject();
                }
            }
            else
            {
                // Clicked on empty space
                DeselectObject();
            }
        }

        // Persist gizmo edits back to React/Firestore once drag is released.
        if (Input.GetMouseButtonUp(0) &&
            (currentTool == ToolMode.Move || currentTool == ToolMode.Rotate || currentTool == ToolMode.Scale))
        {
            BroadcastSelectedTransformIfChanged();
        }
    }

    private static float RoundValue(float value)
    {
        return Mathf.Round(value * Precision) / Precision;
    }

    private static bool IsDifferent(Vector3 left, Vector3 right)
    {
        return Vector3.SqrMagnitude(left - right) > Epsilon * Epsilon;
    }

    private static Vector3 ToScenePosition(Vector3 worldPosition)
    {
        var x = (worldPosition.x - XSceneMin) / (XSceneMax - XSceneMin) * 10f;
        var z = (worldPosition.z - ZSceneMin) / (ZSceneMax - ZSceneMin) * 10f;
        return new Vector3(x, worldPosition.y, z);
    }

    private static Vector3 RoundVector(Vector3 value)
    {
        return new Vector3(
            RoundValue(value.x),
            RoundValue(value.y),
            RoundValue(value.z)
        );
    }

    private bool TryGetSelectedObject(out GameObject selectedGo)
    {
        selectedGo = null;
        if (string.IsNullOrEmpty(selectedObjectName)) return false;
        selectedGo = GameObject.Find(selectedObjectName);
        return selectedGo != null;
    }

    private void CaptureTransformSnapshot(GameObject selectedGo)
    {
        lastSyncedPosition = RoundVector(ToScenePosition(selectedGo.transform.localPosition));
        lastSyncedRotation = RoundVector(selectedGo.transform.eulerAngles);
        lastSyncedScale = RoundVector(selectedGo.transform.localScale);
        hasSyncedTransform = true;
    }

    private void BroadcastSelectedTransformIfChanged()
    {
        if (!TryGetSelectedObject(out var selectedGo)) return;

        var scenePosition = RoundVector(ToScenePosition(selectedGo.transform.localPosition));
        var sceneRotation = RoundVector(selectedGo.transform.eulerAngles);
        var sceneScale = RoundVector(selectedGo.transform.localScale);

        if (hasSyncedTransform &&
            !IsDifferent(scenePosition, lastSyncedPosition) &&
            !IsDifferent(sceneRotation, lastSyncedRotation) &&
            !IsDifferent(sceneScale, lastSyncedScale))
        {
            return;
        }

        var payload = new TransformSyncPayload
        {
            objectName = selectedObjectName,
            position = new[] { scenePosition.x, scenePosition.y, scenePosition.z },
            rotation = new[] { sceneRotation.x, sceneRotation.y, sceneRotation.z },
            scale = new[] { sceneScale.x, sceneScale.y, sceneScale.z },
        };

        ReactBridge.SendObjectTransformChanged(JsonUtility.ToJson(payload));

        lastSyncedPosition = scenePosition;
        lastSyncedRotation = sceneRotation;
        lastSyncedScale = sceneScale;
        hasSyncedTransform = true;
    }

    private void SelectObject(string objectName)
    {
        if (selectedObjectName == objectName) return; // Already selected

        selectedObjectName = objectName;
        Debug.Log($"[ToolController] Selected object: {selectedObjectName}");

        // Attach runtime handle to the selected object
        if (runtimeHandle != null)
        {
            var selectedGo = GameObject.Find(selectedObjectName);
            if (selectedGo != null)
            {
                runtimeHandle.SetTarget(selectedGo);
                runtimeHandle.gameObject.SetActive(true);
                SyncHandleMode();
                CaptureTransformSnapshot(selectedGo);
            }
        }
        
        // Notify React
        ReactBridge.SendObjectSelected(selectedObjectName);
    }

    private void DeselectObject()
    {
        if (string.IsNullOrEmpty(selectedObjectName)) return; // Already deselected

        selectedObjectName = "";
        Debug.Log("[ToolController] Deselected object");

        if (runtimeHandle != null)
        {
            runtimeHandle.gameObject.SetActive(false);
        }

        hasSyncedTransform = false;
        
        // Notify React (sending empty string)
        ReactBridge.SendObjectSelected("");
    }

    private void SyncHandleMode()
    {
        if (runtimeHandle == null)
        {
            return;
        }

        // Default to all axes enabled
        runtimeHandle.SetAxis(HandleAxes.XYZ);

        // Enable/disable handle based on current tool
        switch (currentTool)
        {
            case ToolMode.Move:
                runtimeHandle.SetHandleMode(HandleType.POSITION);
                runtimeHandle.gameObject.SetActive(!string.IsNullOrEmpty(selectedObjectName));
                break;
            case ToolMode.Rotate:
                runtimeHandle.SetHandleMode(HandleType.ROTATION);
                runtimeHandle.gameObject.SetActive(!string.IsNullOrEmpty(selectedObjectName));
                break;
            case ToolMode.Scale:
                runtimeHandle.SetHandleMode(HandleType.SCALE);
                runtimeHandle.gameObject.SetActive(!string.IsNullOrEmpty(selectedObjectName));
                break;
            default:
                // Hand / Rect / Transform not wired yet – hide gizmo
                runtimeHandle.gameObject.SetActive(false);
                break;
        }
    }

    // -------------------------------------------------------------------------
    // Gizmo rendering placeholder
    // In a real implementation, you would use a runtime transform gizmo asset 
    // like RuntimeTransformHandle. Since we don't have that asset imported, 
    // we use OnDrawGizmos to visualize the intent in the editor, and a proper
    // built-in solution would render meshes at runtime.
    // -------------------------------------------------------------------------
    void OnDrawGizmos()
    {
        if (string.IsNullOrEmpty(selectedObjectName) || objectManager == null) return;
        
        GameObject selectedGo = GameObject.Find(selectedObjectName);
        if (selectedGo == null) return;

        Vector3 pos = selectedGo.transform.position;
        float size = 1.0f; // Gizmo size

        switch (currentTool)
        {
            case ToolMode.Move:
                Gizmos.color = Color.red; Gizmos.DrawRay(pos, selectedGo.transform.right * size);
                Gizmos.color = Color.green; Gizmos.DrawRay(pos, selectedGo.transform.up * size);
                Gizmos.color = Color.blue; Gizmos.DrawRay(pos, selectedGo.transform.forward * size);
                break;
            case ToolMode.Rotate:
                Gizmos.color = Color.yellow; 
                Gizmos.DrawWireSphere(pos, size * 0.8f);
                break;
            case ToolMode.Scale:
                Gizmos.color = Color.white;
                Gizmos.DrawWireCube(pos, Vector3.one * (size * 1.2f));
                break;
            // Add remaining tools logic here
        }
    }
}
