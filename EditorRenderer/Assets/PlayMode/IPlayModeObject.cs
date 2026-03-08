using System.Collections.Generic;
using UnityEngine;

namespace Assets.PlayMode
{
    /// <summary>
    /// Abstraction for an object that the logic instructions can manipulate.
    /// Implemented by EditorPlayModeObject (wraps SceneObject) so the same
    /// instruction code can run in WebGL as in the student APK.
    /// </summary>
    public interface IPlayModeObject
    {
        void UpdatePosition(List<float> position);
        void UpdateRotation(List<float> rotation);
        void UpdateScale(List<float> scale);
        void UpdateColor(string color);
        void UpdateColor(float r, float g, float b);
        void UpdateStaticFriction(float value);
        void UpdateDynamicFriction(float value);
        Vector3 GetPosition();
        Vector3 GetRotation();
        Vector3 GetScale();
    }
}
