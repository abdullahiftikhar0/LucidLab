using System.Collections.Generic;
using Assets.Logic.Misc;
using Assets.PlayMode;
using UnityEngine;

namespace Assets.Logic.Instructions.Properties
{
    public class GetScaleInstruction : DataInstruction
    {
        public GetScaleInstruction(Dictionary<string, InputParam> inputs, Dictionary<string, string> parms) : base(inputs, parms) { }

        public override object GetOutput(string outputName)
        {
            if (controls == null || !controls.TryGetValue("object", out var objName)) return 1f;
            var obj = GetContext().GetObject(objName);
            if (obj == null) return 1f;
            var s = obj.GetScale();
            return outputName switch { "x" => s.x, "y" => s.y, "z" => s.z, _ => s.x };
        }
    }
}
