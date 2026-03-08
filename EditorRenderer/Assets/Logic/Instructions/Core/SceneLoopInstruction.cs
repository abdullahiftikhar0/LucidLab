using System.Collections.Generic;
using Assets.Logic.Misc;

namespace Assets.Logic.Instructions.Core
{
    public class SceneLoopInstruction : ExecInstruction
    {
        public override bool IsLoopInstruction => true;
        public override object GetOutput(string outputName) => throw new System.NotImplementedException();
        protected override void ExecuteImpl() { }

        public SceneLoopInstruction(Dictionary<string, InputParam> inputs, Dictionary<string, string> parms,
            Dictionary<string, ExecInstruction> nxtInstructions) : base(inputs, parms, nxtInstructions) { }
    }
}
