using System.Collections.Generic;
using Assets.Logic.Misc;
using Assets.PlayMode;

namespace Assets.Logic.Instructions.Actions
{
    public class ShowMessageInstruction : ExecInstruction
    {
        public override object GetOutput(string outputName) => throw new System.NotImplementedException();

        protected override void ExecuteImpl()
        {
            var msg = inputs != null && inputs.TryGetValue("message", out var m) ? m.GetValue()?.ToString() : null;
            PlayModeMessageBridge.ShowMessage(msg ?? "");
        }

        public ShowMessageInstruction(Dictionary<string, InputParam> inputs, Dictionary<string, string> parms,
            Dictionary<string, ExecInstruction> nxtInstructions) : base(inputs, parms, nxtInstructions) { }
    }
}
