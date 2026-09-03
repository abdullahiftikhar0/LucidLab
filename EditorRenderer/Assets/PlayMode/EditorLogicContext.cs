using UnityEngine;

namespace Assets.PlayMode
{
    public class EditorLogicContext : ILogicContext
    {
        private readonly ObjectManagement _objectManagement;

        public EditorLogicContext(ObjectManagement objectManagement)
        {
            _objectManagement = objectManagement;
        }

        public IPlayModeObject GetObject(string name)
        {
            var sceneObj = _objectManagement.GetSceneObject(name);
            return sceneObj != null ? new EditorPlayModeObject(sceneObj) : null;
        }
    }
}
