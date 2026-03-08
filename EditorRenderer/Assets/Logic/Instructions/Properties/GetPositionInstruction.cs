using System;
using System.Collections.Generic;
using Assets.Logic.Misc;
using Assets.PlayMode;
using UnityEngine;

namespace Assets.Logic.Instructions.Properties
{
    public class GetPositionInstruction : DataInstruction
    {
        public GetPositionInstruction(Dictionary<string, InputParam> inputs, Dictionary<string, string> parms) : base(inputs, parms) { }

        public override object GetOutput(string outputName)
        {
            if (controls == null || !controls.TryGetValue("object", out var objName)) return 0f;
            var obj = GetContext().GetObject(objName);
            if (obj == null) return 0f;
            var p = obj.GetPosition();
            return outputName switch { "x" => p.x, "y" => p.y, "z" => p.z, _ => p.x };
        }
    }
}
