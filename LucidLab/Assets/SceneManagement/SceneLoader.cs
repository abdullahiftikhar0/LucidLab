using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Assets.SceneManagement.Models;
using Firebase.Extensions;
using Firebase.Firestore;
using UnityEngine;

namespace Assets.SceneManagement {
    public class SceneLoader : MonoBehaviour {
        private FirebaseFirestore _db {
            get {
                if (__db == null) __db = FirebaseFirestore.DefaultInstance;
                return __db;
            }
        }
        private FirebaseFirestore __db;
        public string experimentName;
        public List<SceneData> Scenes { get; private set; }

        [System.Serializable]
        private class ExperimentLaunchPayload {
            public string experimentId;
        }

        private static string ParseExperimentIdFromPayload(string payload) {
            if (string.IsNullOrWhiteSpace(payload)) return null;
            var trimmed = payload.Trim();
            if (!trimmed.StartsWith("{")) return trimmed;

            try {
                var parsed = JsonUtility.FromJson<ExperimentLaunchPayload>(trimmed);
                if (!string.IsNullOrWhiteSpace(parsed?.experimentId)) return parsed.experimentId;
            } catch {
                // Ignore parse errors and fall through to null.
            }

            return null;
        }

        private static string ResolveExperimentNameFromPrefs() {
            var experimentId = PlayerPrefs.GetString("experimentId", "");
            if (!string.IsNullOrWhiteSpace(experimentId)) return experimentId;

            var expname = PlayerPrefs.GetString("expname", "");
            var fromExpName = ParseExperimentIdFromPayload(expname);
            if (!string.IsNullOrWhiteSpace(fromExpName)) return fromExpName;

            var currentExperiment = PlayerPrefs.GetString("current_experiment", "");
            var fromCurrent = ParseExperimentIdFromPayload(currentExperiment);
            if (!string.IsNullOrWhiteSpace(fromCurrent)) return fromCurrent;

            return null;
        }

        public async Task LoadAllScenes() {
            Debug.Log($"[SceneLoader] LoadAllScenes START, experimentName='{experimentName}'");
            if (string.IsNullOrEmpty(experimentName)) {
                Debug.LogError("[SceneLoader] experimentName is null or empty!");
                return;
            }

            Scenes = new List<SceneData>();
            try {
                var scenesRef = _db.Collection($"experiments/{experimentName}/scenes");
                Debug.Log($"[SceneLoader] Querying Firestore: experiments/{experimentName}/scenes");
                var snapshot = await scenesRef.GetSnapshotAsync();
                Debug.Log($"[SceneLoader] Got {snapshot.Documents.Count()} scene documents from Firestore.");
                foreach (var documentSnapshot in snapshot.Documents) {
                    var scene = documentSnapshot.ConvertTo<SceneData>();
                    int markerCount = scene.markers?.Count ?? 0;
                    Debug.Log($"[SceneLoader] Scene '{scene.name}' (index={scene.index}): {markerCount} marker(s)");
                    if (scene.markers != null) {
                        foreach (var m in scene.markers) {
                            Debug.Log($"[SceneLoader]   Marker: id='{m.id}', name='{m.name}', imageUrl='{m.imageUrl}'");
                        }
                    }
                    scene = await LoadScene(scene);
                    Scenes.Add(scene);
                }
                Scenes.Sort((a, b) => a.index - b.index);
                Debug.Log($"[SceneLoader] LoadAllScenes DONE. {Scenes.Count} scene(s) loaded.");
            } catch (System.Exception e) {
                Debug.LogError($"[SceneLoader] Error loading scenes: {e.Message}\n{e.StackTrace}");
            }
        }

        public async Task<SceneData> LoadScene(SceneData scene) {
            try {
                var objectsRef = _db.Collection($"experiments/{experimentName}/scenes/{scene.name}/objects");
                var snapshot = await objectsRef.GetSnapshotAsync();
                scene.objects = new List<ObjectData>();
                foreach (var documentSnapshot in snapshot.Documents) {
                    var obj = documentSnapshot.ConvertTo<ObjectData>();
                    scene.objects.Add(obj);
                }
            } catch (System.Exception e) {
                Debug.LogError($"[SceneLoader] Error loading scene {scene.name}: {e.Message}");
            }
            return scene;
        }

        public SceneData GetSceneIndex(int idx) => idx < Scenes?.Count ? Scenes[idx] : null;

        public SceneData GetSceneWithName(string nme) => Scenes?.Find(x => x.name == nme);

        void Start() {
            // Initialization handled via property getter
        }

        void Awake() {
            experimentName = ResolveExperimentNameFromPrefs();
            Debug.Log($"[SceneLoader] Awake: experimentName='{experimentName}' (expname='{PlayerPrefs.GetString("expname", "<unset>")}', current_experiment='{PlayerPrefs.GetString("current_experiment", "<unset>")}')" );
        }
    }
}
