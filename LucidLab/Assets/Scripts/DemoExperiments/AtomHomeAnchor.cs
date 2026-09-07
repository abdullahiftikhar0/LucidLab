using UnityEngine;

/// <summary>
/// Remembers an Atom's original parent under its ImageTarget so it can be restored
/// when that marker leaves the camera view (after interaction scripts reparent it).
/// </summary>
public class AtomHomeAnchor : MonoBehaviour
{
    Transform _homeParent;
    Vector3 _homeLocalPosition;
    Quaternion _homeLocalRotation;
    bool _captured;

    void Awake()
    {
        CaptureHome();
    }

    public void CaptureHome()
    {
        _homeParent = transform.parent;
        _homeLocalPosition = transform.localPosition;
        _homeLocalRotation = transform.localRotation;
        _captured = true;
    }

    public bool BelongsToTrackable(Transform imageTargetTransform)
    {
        return _captured && _homeParent != null && _homeParent.IsChildOf(imageTargetTransform);
    }

    public void ResetToHome()
    {
        if (!_captured || _homeParent == null)
            return;

        transform.SetParent(_homeParent, false);
        transform.localPosition = _homeLocalPosition;
        transform.localRotation = _homeLocalRotation;
    }
}
