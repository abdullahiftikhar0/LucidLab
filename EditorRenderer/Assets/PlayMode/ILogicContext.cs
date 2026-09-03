namespace Assets.PlayMode
{
    /// <summary>
    /// Provides access to scene objects during logic execution.
    /// In LucidLab this is the Scene; in EditorRenderer (WebGL) it wraps ObjectManagement.
    /// </summary>
    public interface ILogicContext
    {
        IPlayModeObject GetObject(string name);
    }
}
