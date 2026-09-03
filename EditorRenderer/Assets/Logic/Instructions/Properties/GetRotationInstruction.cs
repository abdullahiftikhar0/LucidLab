using System.Collections.Generic;
using Assets.Logic.Misc;
using Assets.PlayMode;
using UnityEngine;

namespace Assets.Logic.Instructions.Properties
{
    public class GetRotationInstruction : DataInstruction
    {
        public GetRotationInstruction(Dictionary<string, InputParam> inputs, Dictionary<string, string> parms) : base(inputs, parms) { }

        public override object GetOutput(string outputName)
        {
            if (controls == null || !controls.TryGetValue("object", out var objName)) return 0f;
            var obj = GetContext().GetObject(objName);
            if (obj == null) return 0f;
            var r = obj.GetRotation();
            return outputName switch { "x" => r.x, "y" => r.y, "z" => r.z, _ => r.x };
        }
    }
}
