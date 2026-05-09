using System.Collections.Generic;
using System.Threading.Tasks;
using UnityEngine;
using UnityEngine.Networking;
using UnityEngine.XR.ARFoundation;
using UnityEngine.XR.ARSubsystems;
using Assets.SceneManagement.Models;

namespace Assets.Interaction {
    /// <summary>
    /// Listens to ARTrackedImageManager events and maintains a registry of
    /// marker name → Transform. ObjectBuilder uses this registry to parent
    /// experiment objects under the correct tracked image when markerId is set.
    /// Also handles dynamic runtime marker downloading and injection into the AR Library.
    /// </summary>
    public class ARExperimentManager : MonoBehaviour {
        [Header("References")]
        [Tooltip("Assign the ARTrackedImageManager from your XR Origin")]
        public ARTrackedImageManager trackedImageManager;

        /// <summary>
        /// Global registry: marker reference image name → world-space Transform.
        /// ObjectBuilder reads this to parent objects under tracked images.
        /// </summary>
        public static readonly Dictionary<string, Transform> MarkerTransforms = new();

        public delegate void MarkerTrackedHandler(string markerId, Transform transform);
        public static event MarkerTrackedHandler OnMarkerTracked;

        public delegate void MarkerLostHandler(string markerId);
        public static event MarkerLostHandler OnMarkerLost;

        [Header("Debug")]
        [Tooltip("Number of currently tracked markers")]
        public int activeMarkerCount;

        void OnEnable() {
            if (trackedImageManager != null)
                trackedImageManager.trackedImagesChanged += OnTrackedImagesChanged;
        }

        void OnDisable() {
            if (trackedImageManager != null)
                trackedImageManager.trackedImagesChanged -= OnTrackedImagesChanged;
            MarkerTransforms.Clear();
        }

        void OnTrackedImagesChanged(ARTrackedImagesChangedEventArgs args) {
            foreach (var img in args.added) {
                MarkerTransforms[img.referenceImage.name] = img.transform;
                Debug.Log($"[ARExperimentManager] Marker ADDED: {img.referenceImage.name}");
                OnMarkerTracked?.Invoke(img.referenceImage.name, img.transform);
            }

            foreach (var img in args.updated) {
                if (img.trackingState == TrackingState.Tracking) {
                    MarkerTransforms[img.referenceImage.name] = img.transform;
                    OnMarkerTracked?.Invoke(img.referenceImage.name, img.transform);
                } else {
                    MarkerTransforms.Remove(img.referenceImage.name);
                    OnMarkerLost?.Invoke(img.referenceImage.name);
                }
            }

            foreach (var img in args.removed) {
                MarkerTransforms.Remove(img.referenceImage.name);
                Debug.Log($"[ARExperimentManager] Marker REMOVED: {img.referenceImage.name}");
                OnMarkerLost?.Invoke(img.referenceImage.name);
            }

            activeMarkerCount = MarkerTransforms.Count;
        }

        private float _logTimer = 0f;

        void Update() {
            _logTimer += Time.deltaTime;
            if (_logTimer >= 1.0f) { // Log once per second so we don't spam the console
                _logTimer = 0f;
                if (activeMarkerCount > 0) {
                    Debug.Log($"[ARExperimentManager] ✅ TRACKING {activeMarkerCount} marker(s) in view!");
                }
            }
        }

        /// <summary>
        /// Polls a ScheduleAddImageWithValidationJob handle until complete,
        /// then logs whether the specific marker was accepted or rejected.
        /// </summary>
        private async Task WaitForImageJobAsync(
            AddReferenceImageJobState jobState,
            MutableRuntimeReferenceImageLibrary library,
            string markerId) {
            // Wait for the native job to finish
            while (jobState.status == AddReferenceImageJobStatus.Pending ||
                   jobState.status == AddReferenceImageJobStatus.None) {
                await Task.Yield();
            }
            jobState.jobHandle.Complete();

            int count = library.count;
            if (jobState.status == AddReferenceImageJobStatus.Success) {
                Debug.LogWarning($"[ARExperimentManager] ✅ Marker '{markerId}' ACCEPTED. Library now has {count} image(s).");
            } else {
                Debug.LogError($"[ARExperimentManager] ❌ Marker '{markerId}' REJECTED (status={jobState.status}). Library has {count} image(s).");
            }
        }

        /// <summary>
        /// Downloads markers from Firebase Storage URLs provided by SceneData
        /// and injects them into a MutableRuntimeReferenceImageLibrary.
        /// </summary>
        public async Task InitializeDynamicMarkersAsync(List<SceneMarkerData> markers) {
            if (trackedImageManager == null) {
                Debug.LogError("[ARExperimentManager] ARTrackedImageManager is null! Cannot initialize dynamic markers.");
                return;
            }

            // Create a mutable library for runtime injection
            var mutableLibrary = trackedImageManager.CreateRuntimeLibrary() as MutableRuntimeReferenceImageLibrary;
            
            if (mutableLibrary == null) {
                Debug.LogError("[ARExperimentManager] Failed to create MutableRuntimeReferenceImageLibrary. Check AR Foundation configuration.");
                return;
            }

            Debug.Log($"[ARExperimentManager] Downloading {markers.Count} dynamic markers...");

            var jobTasks = new List<Task>();
            foreach (var marker in markers) {
                if (string.IsNullOrEmpty(marker.imageUrl)) {
                    Debug.LogWarning($"[ARExperimentManager] Marker '{marker.id}' has no imageUrl, skipping.");
                    continue;
                }

                Debug.LogWarning($"[ARExperimentManager] Downloading marker '{marker.id}' from: {marker.imageUrl}");
                
                var tcs = new TaskCompletionSource<Texture2D>();

                var uwr = UnityWebRequestTexture.GetTexture(marker.imageUrl);
                var operation = uwr.SendWebRequest();

                operation.completed += (op) => {
                    if (uwr.result == UnityWebRequest.Result.Success) {
                        // Guard against non-raster responses (e.g. SVG) that return 200
                        // but can't be decoded into a Texture2D.
                        string contentType = uwr.GetResponseHeader("Content-Type") ?? "";
                        if (contentType.Contains("svg") || contentType.Contains("xml") || contentType.Contains("html")) {
                            Debug.LogError($"[ARExperimentManager] Marker '{marker.id}' URL returned non-raster content ({contentType}), skipping.");
                            tcs.SetResult(null);
                            uwr.Dispose();
                            return;
                        }
                        try {
                            var tex = DownloadHandlerTexture.GetContent(uwr);
                            Debug.Log($"[ARExperimentManager] Download OK for '{marker.id}': {tex.width}x{tex.height}, format={tex.format}");
                            tcs.SetResult(tex);
                        } catch (System.Exception ex) {
                            Debug.LogError($"[ARExperimentManager] Marker '{marker.id}' texture decode failed: {ex.Message}");
                            tcs.SetResult(null);
                        }
                    } else {
                        Debug.LogError($"[ARExperimentManager] Failed to download marker '{marker.id}': {uwr.error} (HTTP {uwr.responseCode}), URL: {marker.imageUrl}");
                        tcs.SetResult(null);
                    }
                    uwr.Dispose();
                };

                Texture2D texture = await tcs.Task;
                if (texture == null) continue;

                Debug.LogWarning($"[ARExperimentManager] Adding marker '{marker.id}' ({texture.width}x{texture.height}) to AR Library...");
                var jobState = mutableLibrary.ScheduleAddImageWithValidationJob(texture, marker.id, 0.15f);
                jobTasks.Add(WaitForImageJobAsync(jobState, mutableLibrary, marker.id));
            }

            if (jobTasks.Count > 0) {
                await Task.WhenAll(jobTasks);
            }

            // Apply new library — scheduled jobs complete asynchronously after assignment
            try {
                bool wasEnabled = trackedImageManager.enabled;
                trackedImageManager.enabled = false;
                
                trackedImageManager.referenceLibrary = mutableLibrary;
                
                trackedImageManager.enabled = wasEnabled || true; 
                Debug.Log($"[ARExperimentManager] Dynamic AR Markers initialization complete! {markers.Count} marker(s) scheduled.");
            } catch (System.Exception ex) {
                Debug.LogError($"[ARExperimentManager] CRITICAL ERROR assigning library: {ex.Message}\n{ex.StackTrace}");
            }
        }
    }
}
