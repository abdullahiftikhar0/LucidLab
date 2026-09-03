using System.Collections.Generic;
using Assets.Logic.Misc;
using Assets.PlayMode;

namespace Assets.Logic.Instructions.Misc
{
    public class SetColorInstruction : ExecInstruction
    {
        public override object GetOutput(string outputName) => throw new System.NotImplementedException();

        protected override void ExecuteImpl()
        {
            if (controls == null || !controls.TryGetValue("object", out var objName) || string.IsNullOrEmpty(objName)) return;
            if (!controls.TryGetValue("color", out var color) || string.IsNullOrEmpty(color)) return;
            var obj = GetContext().GetObject(objName);
            obj?.UpdateColor(color);
        }

        public SetColorInstruction(Dictionary<string, InputParam> inputs, Dictionary<string, string> parms,
            Dictionary<string, ExecInstruction> nxtInstructions) : base(inputs, parms, nxtInstructions) { }
    }
}
