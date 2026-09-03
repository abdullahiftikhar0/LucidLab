using System.Collections.Generic;
using Assets.Logic.Instructions;

namespace Assets.Logic.Misc
{
    public class ConstantValueInstruction : DataInstruction
    {
        public ConstantValueInstruction(Dictionary<string, InputParam> inputs, Dictionary<string, string> controls)
            : base(inputs, controls) { }

        public override object GetOutput(string outputName)
        {
            if (controls != null && controls.TryGetValue("value", out var s) && float.TryParse(s, out var res))
                return res;
            return controls != null && controls.TryGetValue("value", out var v) ? v : null;
        }
    }
}
