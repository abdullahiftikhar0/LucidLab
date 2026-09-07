using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Events;
using Vuforia;

/// <summary>
/// Ensures each Vuforia ImageTarget's augmentations are only visible while that
/// marker is actually in view (Tracked only — not Extended/Limited tracking).
/// Also restores reparented Atom objects when their home marker is lost.
/// </summary>
[DefaultExecutionOrder(100)]
public class VuforiaStrictMarkerVisibility : MonoBehaviour
{
    readonly List<TrackableBinding> _bindings = new();

    sealed class TrackableBinding
    {
        public DefaultTrackableEventHandler Handler;
        public GameObject AugmentationRoot;
        public Transform ImageTargetTransform;
        public UnityAction OnFound;
        public UnityAction OnLost;
    }

    void Awake()
    {
        EnsureAtomHomeAnchors();

        var handlers = FindObjectsByType<DefaultTrackableEventHandler>(FindObjectsSortMode.None);
        foreach (var handler in handlers)
        {
            handler.StatusFilter = DefaultTrackableEventHandler.TrackingStatusFilter.Tracked;

            var augmentationRoot = FindAugmentationRoot(handler.transform);
            if (augmentationRoot == null)
                continue;

            var binding = new TrackableBinding
            {
                Handler = handler,
                AugmentationRoot = augmentationRoot,
                ImageTargetTransform = handler.transform,
                OnFound = null,
                OnLost = null
            };

            binding.OnFound = () => ShowAugmentation(binding);
            binding.OnLost = () => HideAugmentation(binding);

            handler.OnTargetFound.AddListener(binding.OnFound);
            handler.OnTargetLost.AddListener(binding.OnLost);

            _bindings.Add(binding);
        }
    }

    void Start()
    {
        StartCoroutine(ApplyInitialVisibility());
    }

    IEnumerator ApplyInitialVisibility()
    {
        yield return null;

        foreach (var binding in _bindings)
        {
            if (IsTracked(binding.Handler))
                ShowAugmentation(binding);
            else
                HideAugmentation(binding);
        }
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

    void OnDestroy()
    {
        foreach (var binding in _bindings)
        {
            if (binding.Handler == null)
                continue;

            if (binding.OnFound != null)
                binding.Handler.OnTargetFound.RemoveListener(binding.OnFound);
            if (binding.OnLost != null)
                binding.Handler.OnTargetLost.RemoveListener(binding.OnLost);
        }

        _bindings.Clear();
    }

    static void EnsureAtomHomeAnchors()
    {
        foreach (var imageTarget in FindObjectsByType<ImageTargetBehaviour>(FindObjectsSortMode.None))
        {
            var atoms = imageTarget.GetComponentsInChildren<Transform>(true);
            foreach (var t in atoms)
            {
                if (t.name != "Atom")
                    continue;

                if (t.GetComponent<AtomHomeAnchor>() == null)
                    t.gameObject.AddComponent<AtomHomeAnchor>();
            }
        }
    }

    static GameObject FindAugmentationRoot(Transform imageTarget)
    {
        foreach (Transform child in imageTarget)
        {
            if (child.GetComponent<ImageTargetBehaviour>() != null)
                continue;

            return child.gameObject;
        }

        return null;
    }

    static void ShowAugmentation(TrackableBinding binding)
    {
        binding.AugmentationRoot.SetActive(true);
    }

    static void HideAugmentation(TrackableBinding binding)
    {
        ResetReparentedAtoms(binding.ImageTargetTransform);
        binding.AugmentationRoot.SetActive(false);
    }

    static void ResetReparentedAtoms(Transform imageTargetTransform)
    {
        var anchors = FindObjectsByType<AtomHomeAnchor>(FindObjectsSortMode.None);
        foreach (var anchor in anchors)
        {
            if (anchor.BelongsToTrackable(imageTargetTransform))
                anchor.ResetToHome();
        }
    }
}
