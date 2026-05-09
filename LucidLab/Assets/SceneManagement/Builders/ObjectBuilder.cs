using System.Threading.Tasks;
using Assets.Interaction;
using Assets.SceneManagement.Core;
using Assets.SceneManagement.Models;
using GLTFast;
using GLTFast.Logging;
using TMPro;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.XR.ARFoundation;
#if USING_URP
using GLTFast.Materials;
using UnityEngine.Rendering.Universal;
#endif

namespace Assets.SceneManagement.Builders {
    public class ObjectBuilder : MonoBehaviour {
        public ModelManager modelManager;
        public GameObject bigParent;

        /// <summary>
        /// The primary marker ID for the current scene. Objects without their own
        /// markerId will be anchored to this marker so everything renders on the desk.
        /// Set by SceneBuilder before building objects.
        /// </summary>
        public string primaryMarkerId;

        private static bool ShouldUseArAnchoring() {
            return UnityEngine.Object.FindFirstObjectByType<ARModeManager>() != null
                || UnityEngine.Object.FindFirstObjectByType<ARLockManager>() != null
                || UnityEngine.Object.FindFirstObjectByType<ARTrackedImageManager>() != null
                || UnityEngine.Object.FindFirstObjectByType<ARRaycastManager>() != null;
        }

        private static GltfImport CreateGltfImporter(CollectingLogger logger) {
#if USING_URP
            var urpAsset = QualitySettings.renderPipeline as UniversalRenderPipelineAsset
                ?? GraphicsSettings.defaultRenderPipeline as UniversalRenderPipelineAsset;

            if (urpAsset != null) {
                return new GltfImport(materialGenerator: new UniversalRPMaterialGenerator(urpAsset), logger: logger);
            }
#endif
            return new GltfImport(logger: logger);
        }

        private static Shader GetFallbackShader() {
            return Shader.Find("Universal Render Pipeline/Lit")
                ?? Shader.Find("Universal Render Pipeline/Simple Lit")
                ?? Shader.Find("Standard")
                ?? Shader.Find("Diffuse");
        }

        private static bool IsUnsupportedMaterial(Material material) {
            if (material == null) return true;
            if (material.shader == null) return true;
            if (material.shader.name == "Hidden/InternalErrorShader") return true;
            return !material.shader.isSupported;
        }

        private static Color GetBestEffortColor(Material material) {
            if (material == null) return Color.white;
            if (material.HasProperty("_BaseColor")) return material.GetColor("_BaseColor");
            if (material.HasProperty("_Color")) return material.color;
            return Color.white;
        }

        private static Texture GetBestEffortTexture(Material material) {
            if (material == null) return null;
            if (material.HasProperty("_BaseMap")) {
                var tex = material.GetTexture("_BaseMap");
                if (tex != null) return tex;
            }

            if (material.HasProperty("_MainTex")) {
                var tex = material.GetTexture("_MainTex");
                if (tex != null) return tex;
            }

            if (material.HasProperty("_BaseColorMap")) {
                var tex = material.GetTexture("_BaseColorMap");
                if (tex != null) return tex;
            }

            return null;
        }

        private static void ApplyFallbackMaterialValues(Material target, Color color, Texture texture) {
            if (target == null) return;

            if (target.HasProperty("_BaseColor")) target.SetColor("_BaseColor", color);
            if (target.HasProperty("_Color")) target.color = color;

            if (texture != null) {
                if (target.HasProperty("_BaseMap")) target.SetTexture("_BaseMap", texture);
                if (target.HasProperty("_MainTex")) target.SetTexture("_MainTex", texture);
            }
        }

        private static void RepairUnsupportedMaterials(GameObject root, string objectType) {
            if (root == null) return;

            var fallbackShader = GetFallbackShader();
            if (fallbackShader == null) {
                Debug.LogWarning("[ObjectBuilder] Could not find fallback shader for unsupported materials.");
                return;
            }

            try {
                int replacedCount = 0;
                var renderers = root.GetComponentsInChildren<Renderer>(true);
                foreach (var renderer in renderers) {
                    var sharedMats = renderer.sharedMaterials;
                    bool changed = false;
                    for (int i = 0; i < sharedMats.Length; i++) {
                        var mat = sharedMats[i];
                        if (IsUnsupportedMaterial(mat)) {
                            var replacement = new Material(fallbackShader) {
                                name = $"{objectType}_Fallback_{i}"
                            };
                            
                            // Try to preserve original color/texture if it exists
                            ApplyFallbackMaterialValues(
                                replacement, 
                                GetBestEffortColor(mat), 
                                GetBestEffortTexture(mat)
                            );

                            sharedMats[i] = replacement;
                            replacedCount++;
                            changed = true;
                        }
                    }
                    if (changed) renderer.sharedMaterials = sharedMats;
                }

                if (replacedCount > 0) {
                    Debug.LogWarning($"[ObjectBuilder] Replaced {replacedCount} unsupported material(s) on '{objectType}' using fallback shader '{fallbackShader.name}'. (Preserved colors/textures where possible)");
                }

                // Diagnostic: Log the raw bounds of the model before AR scale
                if (renderers.Length > 0) {
                    Bounds b = new Bounds(renderers[0].bounds.center, Vector3.zero);
                    foreach (var r in renderers) b.Encapsulate(r.bounds);
                    Debug.Log($"[ObjectBuilder] 📏 RAW MODEL BOUNDS (pre-scale) — size={b.size}, center={b.center}");

                    // 📐 ROBUST NORMALIZATION: Scale to 1m baseline and sit bottom on Y=0
                    float maxDim = Mathf.Max(b.size.x, Mathf.Max(b.size.y, b.size.z));
                    if (maxDim > 0) {
                        // 1. Scale to a 1.0m unit baseline (makes designer scaling predictable)
                        float scaleMultiplier = 1.0f / maxDim;
                        root.transform.localScale *= scaleMultiplier;
                        
                        // Update bounds for pivot calculation
                        b.center *= scaleMultiplier;
                        b.size *= scaleMultiplier;
                        
                        // 2. Pivot Alignment: Sit bottom at Y=0 and center X/Z at 0
                        // Calculate offset to move the visual bottom to the root origin
                        Vector3 bottomOffset = new Vector3(b.center.x, b.center.y - (b.size.y / 2f), b.center.z);
                        
                        foreach (Transform child in root.transform) {
                            child.localPosition -= bottomOffset;
                        }
                        
                        Debug.Log($"[ObjectBuilder] ⚖️ NORMALIZED '{objectType}': Scale={scaleMultiplier}x, BottomOffset={-bottomOffset}");
                    }
                }
            } catch (System.Exception e) {
                Debug.LogError($"[ObjectBuilder] Failed to repair materials for {objectType}: {e.Message}");
            }
        }

        public async Task<Core.Object> CreateObjectFromData(ObjectData objectData) {
            GameObject gameObj;
            bool isCustomObj = false;
            switch (objectData.objectType) {
                case "cube":
                    gameObj = GameObject.CreatePrimitive(PrimitiveType.Cube);
                    break;
                case "sphere":
                    gameObj = GameObject.CreatePrimitive(PrimitiveType.Sphere);
                    break;
                case "cylinder":
                    gameObj = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
                    break;
                case "capsule":
                    gameObj = GameObject.CreatePrimitive(PrimitiveType.Capsule);
                    break;
                default:
                    gameObj = new GameObject();
                    var loadedCustomModel = false;
                    var loadFailureReason = "Unknown error.";
                    if (modelManager != null) {
                        var cachedData = await modelManager.GetModelBytes(objectData.objectType);
                        if (cachedData == null || cachedData.Length == 0) {
                            loadFailureReason = "Model bytes were empty or unavailable.";
                        } else {
                            var gltfLogger = new CollectingLogger();
                            using var gltf = CreateGltfImporter(gltfLogger);
                            var success = await gltf.Load(cachedData);
                            if (success) {
                                loadedCustomModel = await gltf.InstantiateMainSceneAsync(gameObj.transform);
                                if (!loadedCustomModel) {
                                    loadFailureReason = "glTF loaded but scene instantiation failed.";
                                }
                            } else {
                                loadFailureReason = "glTF parsing/import failed.";
                            }

                            if (!loadedCustomModel && gltfLogger.Count > 0) {
                                gltfLogger.LogAll();
                            }
                        }
                    } else {
                        loadFailureReason = "ModelManager reference is missing.";
                    }

                    if (!loadedCustomModel) {
                        Debug.LogWarning($"[ObjectBuilder] Failed to load custom model '{objectData.objectType}'. Reason: {loadFailureReason}. Falling back to cube primitive.");
                        Destroy(gameObj);
                        gameObj = GameObject.CreatePrimitive(PrimitiveType.Cube);
                        isCustomObj = false;
                        break;
                    }

                    foreach (var renderer in gameObj.GetComponentsInChildren<Renderer>()) {
                        var collider = renderer.gameObject.AddComponent<MeshCollider>();
                        collider.convex = true;
                    }
                    isCustomObj = true;
                    break;
            }

                    RepairUnsupportedMaterials(gameObj, objectData.objectType);

            gameObj.name = objectData.objectName;
            gameObj.AddComponent<Rigidbody>();

            // Determine which marker this object anchors to
            string effectiveMarkerId = !string.IsNullOrEmpty(objectData.markerId)
                ? objectData.markerId
                : primaryMarkerId;

            var shouldUseArAnchoring = ShouldUseArAnchoring();

            // In AR scenes, always attach MarkerAnchor so markerless scenes stay hidden
            // until explicit plane placement.
            if (!string.IsNullOrEmpty(effectiveMarkerId) || shouldUseArAnchoring) {
                var anchor = gameObj.AddComponent<MarkerAnchor>();
                anchor.markerId = effectiveMarkerId;
            } else if (bigParent != null) {
                // Non-AR fallback path.
                gameObj.transform.parent = bigParent.transform;
            }

            // Label follows the object
            var labelGameObject = new GameObject(objectData.objectName + " Label");
            labelGameObject.transform.parent = gameObj.transform;
            var syncComp = labelGameObject.AddComponent<LabelSyncComponent>();
            syncComp.modelGameObject = gameObj;
            labelGameObject.transform.localScale = new Vector3(-1, 1, 1);
            var textMeshPro = labelGameObject.AddComponent<TextMeshPro>();
            textMeshPro.text = objectData.showDesc ? objectData.objectName : "";
            textMeshPro.fontSize = 0.1f;
            textMeshPro.alignment = TextAlignmentOptions.Center;
            textMeshPro.verticalAlignment = VerticalAlignmentOptions.Middle;

            var obj = new Core.Object(gameObj, labelGameObject, isCustomObj);

            if (objectData.scale != null) obj.UpdateScale(objectData.scale);
            obj.UpdateGravity(objectData.hasGravity);
            if (!string.IsNullOrEmpty(objectData.color)) obj.UpdateColor(objectData.color);
            if (objectData.position != null) obj.UpdatePosition(objectData.position);
            if (objectData.rotation != null) obj.UpdateRotation(objectData.rotation);
            obj.UpdateGrabable(objectData.isGrabbable);

            return obj;
        }
    }
}

