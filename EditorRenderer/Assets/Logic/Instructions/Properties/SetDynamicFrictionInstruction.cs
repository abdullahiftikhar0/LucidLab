using System;
using System.Collections.Generic;
using Assets.Logic.Misc;
using Assets.PlayMode;

namespace Assets.Logic.Instructions.Properties
{
    public class SetDynamicFrictionInstruction : ExecInstruction
    {
        public SetDynamicFrictionInstruction(Dictionary<string, InputParam> inputs, Dictionary<string, string> parms, Dictionary<string, ExecInstruction> nxtInstructions) : base(inputs, parms, nxtInstructions) { }

        public override object GetOutput(string outputName) => throw new NotImplementedException();

        protected override void ExecuteImpl()
        {
            if (controls == null || !controls.TryGetValue("object", out var objName) || string.IsNullOrEmpty(objName)) return;
            var obj = GetContext().GetObject(objName);
            if (obj == null) return;
            var inputVal = inputs.GetValueOrDefault("value")?.GetValue();
            if (inputVal == null || (inputVal is string s && string.IsNullOrEmpty(s))) return;
            var val = Convert.ToSingle(inputVal);
            if (val < 0) return;
            obj.UpdateDynamicFriction(val);
        }
    }
}
