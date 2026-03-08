using System.Collections.Generic;
using Assets.Logic.Misc;

namespace Assets.Logic.Instructions.Core
{
    public class SceneLoadInstruction : ExecInstruction
    {
        public override bool IsStartInstruction => true;
        public override object GetOutput(string outputName) => throw new System.NotImplementedException();
        protected override void ExecuteImpl() { }

        public SceneLoadInstruction(Dictionary<string, InputParam> inputs, Dictionary<string, string> parms,
            Dictionary<string, ExecInstruction> nxtInstructions) : base(inputs, parms, nxtInstructions) { }
    }
}
