using System;
using System.Collections.Generic;
using Assets.Logic.Misc;
using Assets.PlayMode;
using UnityEngine;

namespace Assets.Logic.Instructions.Properties
{
    public class SetScaleInstruction : ExecInstruction
    {
        protected override void ExecuteImpl()
        {
            if (controls == null || !controls.TryGetValue("object", out var objName) || string.IsNullOrEmpty(objName)) return;
            var obj = GetContext().GetObject(objName);
            if (obj == null) return;
            var x = inputs != null && inputs.TryGetValue("x", out var xp) ? Convert.ToSingle(xp.GetValue()) : 1f;
            var y = inputs != null && inputs.TryGetValue("y", out var yp) ? Convert.ToSingle(yp.GetValue()) : 1f;
            var z = inputs != null && inputs.TryGetValue("z", out var zp) ? Convert.ToSingle(zp.GetValue()) : 1f;
            obj.UpdateScale(new List<float> { x, y, z });
        }

        public override object GetOutput(string outputName) => throw new NotImplementedException();

        public SetScaleInstruction(Dictionary<string, InputParam> inputs, Dictionary<string, string> parms,
            Dictionary<string, ExecInstruction> nxtInstructions) : base(inputs, parms, nxtInstructions) { }
    }
}
