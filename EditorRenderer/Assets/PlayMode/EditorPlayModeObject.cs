using System.Collections.Generic;
using Assets.Structures;
using UnityEngine;

namespace Assets.PlayMode
{
    public class EditorPlayModeObject : IPlayModeObject
    {
        private readonly SceneObject _sceneObject;

        public EditorPlayModeObject(SceneObject sceneObject)
        {
            _sceneObject = sceneObject;
        }

        public void UpdatePosition(List<float> position)
        {
            if (position == null || position.Count < 3) return;
            _sceneObject.position = position;
            _sceneObject.UpdatePosition();
        }

        public void UpdateRotation(List<float> rotation)
        {
            if (rotation == null || rotation.Count < 3) return;
            _sceneObject.rotation = rotation;
            _sceneObject.UpdateRotation();
        }

        public void UpdateScale(List<float> scale)
        {
            if (scale == null || scale.Count < 3) return;
            _sceneObject.scale = scale;
            _sceneObject.UpdateScale();
        }

        public void UpdateColor(string color)
        {
            _sceneObject.color = color;
            _sceneObject.UpdateColor();
        }

        public void UpdateColor(float r, float g, float b)
        {
            _sceneObject.color = $"#{Mathf.RoundToInt(r * 255):X2}{Mathf.RoundToInt(g * 255):X2}{Mathf.RoundToInt(b * 255):X2}";
            _sceneObject.UpdateColor();
        }

        public void UpdateStaticFriction(float value) => _sceneObject.UpdateStaticFriction(value);
        public void UpdateDynamicFriction(float value) => _sceneObject.UpdateDynamicFriction(value);

        public Vector3 GetPosition()
        {
            var p = _sceneObject.position;
            return p != null && p.Count >= 3 ? new Vector3(p[0], p[1], p[2]) : Vector3.zero;
        }

        public Vector3 GetRotation()
        {
            var r = _sceneObject.rotation;
            return r != null && r.Count >= 3 ? new Vector3(r[0], r[1], r[2]) : Vector3.zero;
        }

        public Vector3 GetScale()
        {
            var s = _sceneObject.scale;
            return s != null && s.Count >= 3 ? new Vector3(s[0], s[1], s[2]) : Vector3.one;
        }
    }
}
