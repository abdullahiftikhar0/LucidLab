using System.Linq;
using Assets.Logic;
using Assets.Logic.Instructions;
using Assets.SceneManagement.Builders;
using Assets.SceneManagement.Models;
using Assets.Interaction;
using Firebase.Extensions;
using TMPro;
using UnityEngine;

namespace Assets.SceneManagement {
    public class SceneManager : MonoBehaviour {
        public SceneLoader sceneLoader;
        public SceneBuilder sceneBuilder;
        public LogicManager logicManager;
        public GameObject sceneDescriptionGameObject;
        public Assets.SceneManagement.Core.Scene currentScene;
        private string _experimentName;
        private bool _sceneReady;
        private bool _logicStartedOnce;
        private bool _loadingScene;
        private bool _hasLaunchSceneSelection;
        private readonly bool _lockSceneToSelectedScene = true;

        public async void SetCurrentScene(SceneData sceneData) {
            if (sceneData == null) {
                Debug.LogWarning("[SceneManager] SetCurrentScene called with null sceneData.");
                return;
            }

            _loadingScene = true;
            _sceneReady = false;
            logicManager.StopExecuting();
            _logicStartedOnce = false;
            if (currentScene != null) {
                currentScene.Destroy();
                currentScene = null;
            }

            currentScene = await sceneBuilder.CreateSceneFromData(sceneData);
            PlayerPrefs.SetString("currentScene", sceneData.name ?? "");
            PlayerPrefs.Save();

            _sceneReady = true;
            _loadingScene = false;
            ApplyTrackingPolicyForScene(sceneData);
            ShowDescription(currentScene.Description);
            // Don't start logic yet — wait for marker tracking in Update()
        }

        [System.Serializable]
        private class ScenePickerMessage {
            public string type;
            public ScenePickerItem[] scenes;
        }

        [System.Serializable]
        private class ScenePickerItem {
            public string name;
            public int index;
            public bool hasMarker;
            public int markerCount;
            public string markerName;
            public string markerImageUrl;
        }

        private bool SceneOwnsMarker(SceneData sceneData, string markerId) {
            return sceneData != null && sceneData.markers != null && sceneData.markers.Any(m => m.id == markerId);
        }

        private string BuildScenePickerPayloadJson() {
            var scenes = sceneLoader.Scenes ?? new System.Collections.Generic.List<SceneData>();
            var sceneItems = scenes
                .OrderBy(s => s.index)
                .Select(s => {
                    var firstMarker = s.markers != null && s.markers.Count > 0 ? s.markers[0] : null;
                    return new ScenePickerItem {
                        name = s.name,
                        index = s.index,
                        hasMarker = s.markers != null && s.markers.Count > 0,
                        markerCount = s.markers != null ? s.markers.Count : 0,
                        markerName = firstMarker != null ? firstMarker.name : null,
                        markerImageUrl = firstMarker != null ? firstMarker.imageUrl : null,
                    };
                })
                .ToArray();

            var msg = new ScenePickerMessage {
                type = "scene_picker_context",
                scenes = sceneItems,
            };

            return JsonUtility.ToJson(msg);
        }

        private void ApplyTrackingPolicyForScene(SceneData sceneData) {
            bool hasMarkers = sceneData != null && sceneData.markers != null && sceneData.markers.Count > 0;

            var hud = FindObjectOfType<ARHudController>();
            if (hud != null) {
                hud.SetMarkerModeEnabled(hasMarkers);
            }

            var toggleUi = FindObjectOfType<TrackingModeToggleUI>();
            if (toggleUi != null) {
                toggleUi.SetMarkerModeEnabled(hasMarkers);

                // Marker-backed scenes default to marker mode; scenes without markers default to plane mode.
                if (hasMarkers) {
                    toggleUi.SetMode(TrackingModeToggleUI.TrackingMode.Marker, true);
                } else {
                    toggleUi.SetMode(TrackingModeToggleUI.TrackingMode.Plane, true);
                }
            }
        }

        public void HandleScenePickerSelection(string sceneName) {
            if (sceneLoader.Scenes == null || sceneLoader.Scenes.Count == 0) {
                Debug.LogWarning("[SceneManager] Scene picker selection received but no scenes are loaded.");
                return;
            }

            var selectedScene = sceneLoader.GetSceneWithName(sceneName);
            if (selectedScene == null) {
                Debug.LogWarning($"[SceneManager] Selected scene '{sceneName}' not found. Falling back to first scene.");
                selectedScene = sceneLoader.Scenes[0];
            }

            _hasLaunchSceneSelection = true;
            HideDescription();
            SetCurrentScene(selectedScene);
        }

        private void OnMarkerDetected(string markerId, Transform markerTransform) {
            if (_loadingScene || !_hasLaunchSceneSelection) return; // Prevent races / pre-selection auto-loading

            if (_lockSceneToSelectedScene) {
                // Keep the user on the explicitly selected scene; do not switch scenes
                // when unrelated markers become visible.
                return;
            }

            // If no scene loaded yet, find the scene that owns this marker and load it
            if (currentScene == null) {
                var sceneWithMarker = sceneLoader.Scenes.FirstOrDefault(s =>
                    SceneOwnsMarker(s, markerId));
                if (sceneWithMarker != null) {
                    HideDescription();
                    SetCurrentScene(sceneWithMarker);
                }
                return;
            }

            // If current scene already owns this marker, ignore (handled by MarkerAnchor)
            if (SceneOwnsMarker(currentScene.sceneData, markerId)) return;

            // Marker belongs to a different scene — switch
            var newScene = sceneLoader.Scenes.FirstOrDefault(s =>
                SceneOwnsMarker(s, markerId));
            if (newScene != null) {
                SetCurrentScene(newScene);
            }
        }

        private void OnMarkerLost(string markerId) {
            if (!_hasLaunchSceneSelection) return;
            // Pause logic when no markers are being tracked and not locked or placed
            if (!ARLockManager.IsLocked && !ARLockManager.IsPlanePlaced && ARExperimentManager.MarkerTransforms.Count == 0 && logicManager.HasStartedExecuting) {
                logicManager.PauseExecuting();
            }
        }

        void StartSceneExecution() {
            if (currentScene == null) return;
            var instructions = currentScene.Instructions ?? System.Array.Empty<DataInstruction>();

            var startInstructions = instructions
                .Where(i => i is ExecInstruction exec && exec.IsStartInstruction)
                .Cast<ExecInstruction>().ToArray();
            var loopInstructions = instructions
                .Where(i => i is ExecInstruction exec && exec.IsLoopInstruction)
                .Cast<ExecInstruction>().ToArray();

            logicManager.InitLogicManager(startInstructions, loopInstructions);
            logicManager.StartExecuting();
            _logicStartedOnce = true;
        }

        void Update() {
            if (!_hasLaunchSceneSelection) return;
            if (!_sceneReady || currentScene == null) return;

            bool isSceneActive = ARExperimentManager.MarkerTransforms.Count > 0 || ARLockManager.IsLocked || ARLockManager.IsPlanePlaced;

            // Start logic on first marker detection or plane placement
            if (isSceneActive && !_logicStartedOnce) {
                StartSceneExecution();
            }
            // Resume logic when markers reappear or plane placed
            else if (isSceneActive && _logicStartedOnce && !logicManager.HasStartedExecuting) {
                logicManager.ResumeExecuting();
            }
        }

        public void ShowDescription(string message) {
            if (sceneDescriptionGameObject != null) {
                sceneDescriptionGameObject.SetActive(true);
                var tmp = sceneDescriptionGameObject.GetComponentsInChildren<TextMeshProUGUI>()
                    .FirstOrDefault(x => x.name == "SceneDescriptionText");
                if (tmp != null) tmp.text = message;
                Debug.Log($"[SceneManager] ShowDescription updated text to: {message}");
            } else {
                Debug.LogWarning("[SceneManager] ShowDescription failed because sceneDescriptionGameObject is NULL!");
            }

            // Update HTML HUD
            var hud = FindObjectOfType<Assets.Interaction.ARHudController>();
            if (hud != null) hud.SetInstruction(message);
        }

        public void HideDescription() {
            if (sceneDescriptionGameObject != null) sceneDescriptionGameObject.SetActive(false);

            var hud = FindObjectOfType<Assets.Interaction.ARHudController>();
            if (hud != null) hud.HideInstruction();
        }

        public void LoadDefaultSceneForPlaneMode() {
            if (!_hasLaunchSceneSelection) return;
            if (currentScene == null && sceneLoader.Scenes != null && sceneLoader.Scenes.Count > 0) {
                Debug.Log("[SceneManager] Loading default scene for Plane Mode.");
                SetCurrentScene(sceneLoader.Scenes[0]);
            }
        }

        async void Start() {
            Debug.Log("[SceneManager] Start() BEGIN");
            ShowDescription("Loading experiment...");
            await sceneLoader.LoadAllScenes();

            if (sceneLoader.Scenes == null || sceneLoader.Scenes.Count == 0) {
                Debug.LogWarning("[SceneManager] No scenes loaded! sceneLoader.Scenes is " + (sceneLoader.Scenes == null ? "null" : "empty"));
                ShowDescription("No scenes found. Check experiment code.");
                return;
            }

            Debug.Log($"[SceneManager] {sceneLoader.Scenes.Count} scene(s) loaded. Collecting markers...");

            // Global Marker Discovery Setup
            var allMarkers = sceneLoader.Scenes
                .Where(s => s.markers != null)
                .SelectMany(s => s.markers).ToList();

            Debug.LogWarning($"[SceneManager] Found {allMarkers.Count} total marker(s) across all scenes.");
            foreach (var m in allMarkers) {
                Debug.LogWarning($"[SceneManager]   → Marker id='{m.id}', name='{m.name}', imageUrl='{(string.IsNullOrEmpty(m.imageUrl) ? "<EMPTY>" : m.imageUrl)}'");
            }

            var arManager = FindObjectOfType<ARExperimentManager>();
            if (arManager != null) {
                Debug.Log("[SceneManager] ARExperimentManager found. Subscribing to events.");
                ARExperimentManager.OnMarkerTracked += OnMarkerDetected;
                ARExperimentManager.OnMarkerLost += OnMarkerLost;
                if (allMarkers.Count > 0) {
                    Debug.Log($"[SceneManager] Calling InitializeDynamicMarkersAsync with {allMarkers.Count} marker(s)...");
                    await arManager.InitializeDynamicMarkersAsync(allMarkers);
                    Debug.Log("[SceneManager] InitializeDynamicMarkersAsync returned.");
                } else {
                    Debug.LogWarning("[SceneManager] No markers to initialize — allMarkers is empty.");
                }
            } else {
                Debug.LogError("[SceneManager] ARExperimentManager NOT FOUND in scene!");
            }

            var preselectedSceneName = PlayerPrefs.GetString("initialSceneName", "");
            if (!string.IsNullOrWhiteSpace(preselectedSceneName)) {
                PlayerPrefs.DeleteKey("initialSceneName");
                PlayerPrefs.Save();

                var preselectedScene = sceneLoader.GetSceneWithName(preselectedSceneName);
                if (preselectedScene != null) {
                    Debug.Log($"[SceneManager] Using preselected launch scene '{preselectedSceneName}'.");
                    HandleScenePickerSelection(preselectedScene.name);
                    return;
                }

                Debug.LogWarning($"[SceneManager] Preselected launch scene '{preselectedSceneName}' not found. Falling back to picker.");
            }

            // Edge Case Fix: Check ARModeManager before defaulting back to marker phrase
            var modeManager = FindObjectOfType<ARModeManager>();
            if (modeManager != null && modeManager.currentMode == TrackingModeToggleUI.TrackingMode.Plane) {
                // If the user already switched the mode while loading, respect the plane state.
                // The Mode Manager's OnPlanesChanged will soon override this if a plane is already visible.
                ShowDescription("Select a scene to start the experiment");
            } else {
                ShowDescription("Select a scene to start the experiment");
            }

            var hud = FindObjectOfType<ARHudController>();
            if (hud != null) {
                hud.ShowScenePicker(BuildScenePickerPayloadJson());
            } else if (sceneLoader.Scenes != null && sceneLoader.Scenes.Count > 0) {
                // Fallback: if no HUD is found, still let students start.
                HandleScenePickerSelection(sceneLoader.Scenes[0].name);
            }
        }

        void OnDestroy() {
            ARExperimentManager.OnMarkerTracked -= OnMarkerDetected;
            ARExperimentManager.OnMarkerLost -= OnMarkerLost;
        }
    }
}
