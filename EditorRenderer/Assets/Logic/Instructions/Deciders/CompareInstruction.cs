using System;
using System.Collections.Generic;
using Assets.Logic.Misc;

namespace Assets.Logic.Instructions.Deciders
{
    public class CompareInstruction : ExecInstruction
    {
        public override object GetOutput(string outputName) => throw new NotImplementedException();
        protected override void ExecuteImpl() { }

        public override void Execute()
        {
            if (inputs == null || !inputs.TryGetValue("left", out var leftParam) || !inputs.TryGetValue("right", out var rightParam)) return;
            var leftVal = leftParam.GetValue();
            var rightVal = rightParam.GetValue();
            if (leftVal is not IComparable leftComp || rightVal is not IComparable rightComp) return;
            var c = leftComp.CompareTo(rightComp);
            if (nextInstructions == null) return;
            if (c == 0 && nextInstructions.TryGetValue("equal", out var eq)) eq?.Execute();
            else if (c < 0 && nextInstructions.TryGetValue("lessthan", out var lt)) lt?.Execute();
            else if (c > 0 && nextInstructions.TryGetValue("biggerthan", out var gt)) gt?.Execute();
        }

        public CompareInstruction(Dictionary<string, InputParam> inputs, Dictionary<string, string> parms,
            Dictionary<string, ExecInstruction> nxtInstructions) : base(inputs, parms, nxtInstructions) { }
    }
}
