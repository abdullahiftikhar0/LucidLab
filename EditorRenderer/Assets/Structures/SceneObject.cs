using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using UnityEngine;
using UnityEngine.Networking;
using System.IO;
using System.Collections;

namespace Assets.Structures {
    public class SceneObject {
        private const float XSceneMin = -0.438f;
        private const float XSceneMax = 0.716f;
        private const float ZSceneMin = -0.017f;
        private const float ZSceneMax = -0.579f;

        public string objectName;
        public string objectType;
        public string color;
        public string description;
        public List<float> position;
        public List<float> rotation;
        public List<float> scale;
        public bool hasGravity;
        public bool isGrabbable;


        private GameObject _gameObject = null;
        private Dictionary<Renderer, Material> _colorMaterials;
        private GameObject _descriptionLabel;
        private TextMesh _descriptionText;

        private bool IsPrimitiveObject() {
            return objectType is "cube" or "sphere" or "cylinder" or "capsule";
        }

        public async void InitGameobject() {
            switch (objectType) {
                case "cube":
                    _gameObject = GameObject.CreatePrimitive(PrimitiveType.Cube);
                    break;
                case "sphere":
                    _gameObject = GameObject.CreatePrimitive(PrimitiveType.Sphere);
                    break;
                case "cylinder":
                    _gameObject = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
                    break;
                case "capsule":
                    _gameObject = GameObject.CreatePrimitive(PrimitiveType.Capsule);
                    break;
                default:
                    _gameObject = new GameObject(objectName);
                    await ModelDownloader.ApplyModelToObject(objectType, _gameObject);

                    foreach (var renderer in _gameObject.GetComponentsInChildren<Renderer>()) {
                        var collider = renderer.gameObject.AddComponent<MeshCollider>();
                        collider.convex = true;
                    }
                    break;
            }

                    // Keep Unity GameObject names aligned with Firestore objectName so
                    // viewport selection and inspector sync use the same key.
                    _gameObject.name = objectName;

            _gameObject.AddComponent<Rigidbody>();

            UpdateColor();
            UpdateGravity();
            UpdatePosition();
            UpdateScale();
            UpdateRotation();
            RefreshDescriptionLabel();
        }

        private static Shader _cachedStandardShader = null;
        private static Shader GetColorableShader() {
            if (_cachedStandardShader != null) return _cachedStandardShader;
            _cachedStandardShader = Shader.Find("Standard");
            if (_cachedStandardShader == null) _cachedStandardShader = Shader.Find("Legacy Shaders/Diffuse");
            if (_cachedStandardShader == null) _cachedStandardShader = Shader.Find("Unlit/Color");
            Debug.Log($"[SceneObject] Resolved color shader: '{_cachedStandardShader?.name ?? "NULL"}'");
            return _cachedStandardShader;
        }

        private static bool LooksLikeHex(string s) {
            if (string.IsNullOrEmpty(s)) return false;
            int len = s.Length;
            if (len != 3 && len != 4 && len != 6 && len != 8) return false;
            for (int i = 0; i < len; i++) {
                char c = s[i];
                bool isHex =
                    (c >= '0' && c <= '9') ||
                    (c >= 'a' && c <= 'f') ||
                    (c >= 'A' && c <= 'F');
                if (!isHex) return false;
            }
            return true;
        }

        public void UpdateColor() {
            if (!_gameObject) throw new Exception("InitGameobject first!");

            var colorToParse = color;
            if (!string.IsNullOrEmpty(colorToParse) && colorToParse[0] != '#') {
                // If it looks like raw hex (e.g. FF0000), prefix '#'; otherwise let Unity
                // handle named colors like "red", "blue", etc.
                if (LooksLikeHex(colorToParse)) {
                    colorToParse = "#" + colorToParse;
                }
            }

            if (!ColorUtility.TryParseHtmlString(colorToParse, out Color clr)) {
                Debug.LogWarning($"[SceneObject] Invalid color string for '{objectName}': {color}");
                return;
            }

            var renderers = _gameObject.GetComponentsInChildren<Renderer>();
            Debug.Log($"[SceneObject] UpdateColor '{objectName}' ({objectType}) -> {color}, renderers={renderers.Length}");

            if (_colorMaterials == null)
                _colorMaterials = new Dictionary<Renderer, Material>();

            foreach (var rend in renderers) {
                if (rend == null) continue;

                Material mat;
                if (!_colorMaterials.TryGetValue(rend, out mat) || mat == null) {
                    // Always create from a known-good shader, never copy from sharedMaterial
                    // (sharedMaterial can be InternalErrorShader in WebGL if the original shader didn't compile)
                    Shader shader = GetColorableShader();
                    if (shader == null) {
                        Debug.LogError($"[SceneObject] No usable shader found — cannot apply color to '{rend.gameObject.name}'");
                        continue;
                    }
                    mat = new Material(shader);
                    mat.name = $"{objectName}_colorMat";
                    _colorMaterials[rend] = mat;
                    Debug.Log($"[SceneObject]   Created new material for '{rend.gameObject.name}' using shader='{shader.name}'");
                }

                mat.color = clr;
                if (mat.HasProperty("_Color")) mat.SetColor("_Color", clr);
                if (mat.HasProperty("_BaseColor")) mat.SetColor("_BaseColor", clr);

                rend.material = mat;
                Debug.Log($"[SceneObject]   Assigned color {clr} to '{rend.gameObject.name}', mat='{mat.name}'");
            }
        }

        public void UpdatePosition() {
            if (!_gameObject) throw new Exception("InitGameobject first!");

            float xPos = position[0] / 10.0f * (XSceneMax - XSceneMin) + XSceneMin;
            float zPos = position[2] / 10.0f * (ZSceneMax - ZSceneMin) + ZSceneMin;
            _gameObject.transform.localPosition = new Vector3(xPos, position[1], zPos);
            RefreshDescriptionLabel();
        }

        private static float ToSceneAxis(float worldValue, float axisMin, float axisMax) {
            return (worldValue - axisMin) / (axisMax - axisMin) * 10.0f;
        }

        public Vector3 GetCurrentScenePosition() {
            if (_gameObject) {
                var p = _gameObject.transform.localPosition;
                return new Vector3(
                    ToSceneAxis(p.x, XSceneMin, XSceneMax),
                    p.y,
                    ToSceneAxis(p.z, ZSceneMin, ZSceneMax)
                );
            }

            if (position != null && position.Count >= 3) {
                return new Vector3(position[0], position[1], position[2]);
            }

            return Vector3.zero;
        }

        public Vector3 GetCurrentRotation() {
            if (_gameObject) return _gameObject.transform.eulerAngles;
            if (rotation != null && rotation.Count >= 3) {
                return new Vector3(rotation[0], rotation[1], rotation[2]);
            }
            return Vector3.zero;
        }

        public Vector3 GetCurrentScale() {
            if (_gameObject) return _gameObject.transform.localScale;
            if (scale != null && scale.Count >= 3) {
                return new Vector3(scale[0], scale[1], scale[2]);
            }
            return Vector3.one;
        }

        public void UpdateScale() {
            if (!_gameObject) throw new Exception("InitGameobject first!");

            _gameObject.transform.localScale = new Vector3(scale[0], scale[1], scale[2]);
            RefreshDescriptionLabel();
        }

        public void UpdateRotation() {
            if (!_gameObject) throw new Exception("InitGameobject first!");

            _gameObject.transform.rotation = Quaternion.Euler(rotation[0], rotation[1], rotation[2]);
        }

        public void UpdateGravity() {
            if (!_gameObject) throw new Exception("InitGameobject first!");

            var rigidBody = _gameObject.GetComponent<Rigidbody>();
            rigidBody.useGravity = hasGravity;
            rigidBody.isKinematic = !hasGravity;
        }

        public void UpdateVisible(bool state) {
            if (!_gameObject) return;
            _gameObject.SetActive(state);
        }

        public void UpdateStaticFriction(float value) {
            if (!_gameObject) return;
            foreach (var collider in _gameObject.GetComponentsInChildren<Collider>()) {
                if (collider.material == null) collider.material = new PhysicMaterial();
                collider.material.staticFriction = value;
            }
        }

        public void UpdateDynamicFriction(float value) {
            if (!_gameObject) return;
            foreach (var collider in _gameObject.GetComponentsInChildren<Collider>()) {
                if (collider.material == null) collider.material = new PhysicMaterial();
                collider.material.dynamicFriction = value;
            }
        }

        public void UpdateBounciness(float value) {
            if (!_gameObject) return;
            foreach (var collider in _gameObject.GetComponentsInChildren<Collider>()) {
                if (collider.material == null) collider.material = new PhysicMaterial();
                collider.material.bounciness = value;
            }
        }

        public void UpdateMass(float value) {
            if (!_gameObject) return;
            var rigidBody = _gameObject.GetComponent<Rigidbody>();
            if (rigidBody != null) rigidBody.mass = value;
        }

        public float GetSpeed() {
            if (!_gameObject) return 0f;
            var rigidBody = _gameObject.GetComponent<Rigidbody>();
            return rigidBody != null ? rigidBody.velocity.magnitude : 0f;
        }

        public void SetDescription(string desc) {
            description = desc ?? string.Empty;
            RefreshDescriptionLabel();
        }

        private void RefreshDescriptionLabel() {
            if (!_gameObject) return;

            if (string.IsNullOrWhiteSpace(description)) {
                if (_descriptionLabel != null) {
                    UnityEngine.Object.Destroy(_descriptionLabel);
                    _descriptionLabel = null;
                    _descriptionText = null;
                }
                return;
            }

            if (_descriptionLabel == null) {
                _descriptionLabel = new GameObject($"{objectName}_DescLabel");
                _descriptionLabel.transform.SetParent(_gameObject.transform, false);
                _descriptionText = _descriptionLabel.AddComponent<TextMesh>();
                _descriptionText.anchor = TextAnchor.LowerCenter;
                _descriptionText.alignment = TextAlignment.Center;
                _descriptionText.fontSize = 64;
                _descriptionText.color = Color.white;
                _descriptionText.richText = false;

                var labelRenderer = _descriptionLabel.GetComponent<MeshRenderer>();
                if (labelRenderer != null) {
                    labelRenderer.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
                    labelRenderer.receiveShadows = false;
                }
            }

            if (_descriptionText == null) {
                _descriptionText = _descriptionLabel.GetComponent<TextMesh>();
                if (_descriptionText == null) {
                    _descriptionText = _descriptionLabel.AddComponent<TextMesh>();
                }
            }

            var maxScaleAxis = Mathf.Max(
                Mathf.Abs(_gameObject.transform.localScale.x),
                Mathf.Abs(_gameObject.transform.localScale.y),
                Mathf.Abs(_gameObject.transform.localScale.z)
            );
            maxScaleAxis = Mathf.Max(maxScaleAxis, 0.05f);

            _descriptionText.text = description;
            _descriptionText.characterSize = Mathf.Clamp(maxScaleAxis * 0.35f, 0.02f, 0.18f);
            _descriptionLabel.transform.localRotation = Quaternion.identity;
            _descriptionLabel.transform.localPosition = new Vector3(0f, Mathf.Clamp(maxScaleAxis * 1.6f, 0.14f, 3f), 0f);
        }

        public void ApplyForce(Vector3 force) {
            if (!_gameObject) return;
            var rigidBody = _gameObject.GetComponent<Rigidbody>();
            if (rigidBody == null) return;
            rigidBody.isKinematic = false;
            rigidBody.AddForce(force);
        }

        public void Dispose() {
            if (_colorMaterials != null) {
                foreach (var mat in _colorMaterials.Values) {
                    if (mat != null) UnityEngine.Object.Destroy(mat);
                }
                _colorMaterials.Clear();
            }
            if (_gameObject != null) {
                if (_descriptionLabel != null) {
                    UnityEngine.Object.Destroy(_descriptionLabel);
                    _descriptionLabel = null;
                    _descriptionText = null;
                }
                foreach (Transform child in _gameObject.transform) {
                    if (child != null) {
                        UnityEngine.Object.Destroy(child.gameObject);
                    }
                }
                UnityEngine.Object.Destroy(_gameObject);
                _gameObject = null;
            }
        }
    }
}
