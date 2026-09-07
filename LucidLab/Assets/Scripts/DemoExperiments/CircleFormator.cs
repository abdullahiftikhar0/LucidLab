using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Events;
using Vuforia;

public class CircleFormator : MonoBehaviour
{
    public GameObject prefab;
    public int ElectronNum;
    public float ElectronDistance = 0.05f;
    public bool Interactable;
    public float InteractSpeed = 0.08f;
    public float InteractStopDistance = 5f;

    readonly List<GameObject> _electrons = new();

    DefaultTrackableEventHandler _trackableHandler;
    UnityAction _onMarkerFound;
    UnityAction _onMarkerLost;

    void OnEnable()
    {
        BindTrackableEvents();
        TrySpawnElectrons();
    }

    void OnDisable()
    {
        UnbindTrackableEvents();
        ClearElectrons();
    }

    void BindTrackableEvents()
    {
        if (_trackableHandler != null)
            return;

        _trackableHandler = GetComponentInParent<DefaultTrackableEventHandler>();
        if (_trackableHandler == null)
            return;

        _onMarkerFound = TrySpawnElectrons;
        _onMarkerLost = ClearElectrons;

        _trackableHandler.OnTargetFound.AddListener(_onMarkerFound);
        _trackableHandler.OnTargetLost.AddListener(_onMarkerLost);
    }

    void UnbindTrackableEvents()
    {
        if (_trackableHandler == null)
            return;

        if (_onMarkerFound != null)
            _trackableHandler.OnTargetFound.RemoveListener(_onMarkerFound);
        if (_onMarkerLost != null)
            _trackableHandler.OnTargetLost.RemoveListener(_onMarkerLost);

        _trackableHandler = null;
        _onMarkerFound = null;
        _onMarkerLost = null;
    }

    void TrySpawnElectrons()
    {
        if (!isActiveAndEnabled || prefab == null || ElectronNum <= 0)
            return;

        if (_electrons.Count > 0)
            return;

        if (_trackableHandler == null || !IsTracked(_trackableHandler))
            return;

        CreateElectronsAroundPoint(ElectronNum, transform.position, ElectronDistance);
    }

    static bool IsTracked(DefaultTrackableEventHandler handler)
    {
        var trackable = handler.GetComponent<TrackableBehaviour>();
        if (trackable == null)
            return false;

        var status = trackable.CurrentStatus;
        return status == TrackableBehaviour.Status.TRACKED
            || status == TrackableBehaviour.Status.DETECTED;
    }

    void ClearElectrons()
    {
        for (int i = _electrons.Count - 1; i >= 0; i--)
        {
            if (_electrons[i] != null)
                Destroy(_electrons[i]);
        }

        _electrons.Clear();
    }

    void CreateElectronsAroundPoint(int num, Vector3 point, float radius)
    {
        for (int i = 0; i < num; i++)
        {
            var radians = 2 * Mathf.PI / num * i;
            var vertical = Mathf.Sin(radians);
            var horizontal = Mathf.Cos(radians);
            var spawnDir = new Vector3(horizontal, 0, vertical);
            var spawnPos = point + spawnDir * radius;

            var electron = Instantiate(prefab, spawnPos, Quaternion.identity, transform);
            electron.transform.LookAt(point);
            _electrons.Add(electron);
        }
    }

    void OnDrawGizmosSelected()
    {
        Gizmos.color = Color.red;
        Gizmos.DrawWireSphere(transform.position, ElectronDistance);
    }
}
