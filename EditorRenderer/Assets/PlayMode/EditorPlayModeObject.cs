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

        public void UpdateVisible(bool state) => _sceneObject.UpdateVisible(state);

        public void UpdateStaticFriction(float value) => _sceneObject.UpdateStaticFriction(value);
        public void UpdateDynamicFriction(float value) => _sceneObject.UpdateDynamicFriction(value);
        public void UpdateBounciness(float value) => _sceneObject.UpdateBounciness(value);
        public void UpdateMass(float value) => _sceneObject.UpdateMass(value);
        public void SetDescription(string description) => _sceneObject.SetDescription(description);
        public void ApplyForce(Vector3 force) => _sceneObject.ApplyForce(force);

        public Vector3 GetPosition()
        {
            return _sceneObject.GetCurrentScenePosition();
        }

        public Vector3 GetRotation()
        {
            return _sceneObject.GetCurrentRotation();
        }

        public Vector3 GetScale()
        {
            return _sceneObject.GetCurrentScale();
        }

        public float GetSpeed() => _sceneObject.GetSpeed();
    }
}
