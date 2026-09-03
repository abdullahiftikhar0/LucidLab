namespace Assets.PlayMode
{
    /// <summary>
    /// Static holder for the current logic context so instructions can resolve objects
    /// without depending on SceneManager (which doesn't exist in the WebGL editor build).
    /// Set by PlayModeRunner when Play starts; cleared when Play stops.
    /// </summary>
    public static class LogicContext
    {
        public static ILogicContext Current { get; set; }
    }
}
