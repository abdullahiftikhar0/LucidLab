using System;
using System.Collections.Generic;
using Assets.Logic.Misc;
using Assets.PlayMode;
using UnityEngine;

namespace Assets.Logic.Instructions.Misc
{
    public class GetDistanceBetweenInstruction : DataInstruction
    {
        public GetDistanceBetweenInstruction(Dictionary<string, InputParam> inputs, Dictionary<string, string> controls)
            : base(inputs, controls) { }

        public override object GetOutput(string outputName)
        {
            if (outputName != "value") throw new NotImplementedException();

            if (controls == null ||
                !controls.TryGetValue("object1", out var object1Name) ||
                !controls.TryGetValue("object2", out var object2Name))
            {
                return 0f;
            }

            var context = GetContext();
            var obj1 = context?.GetObject(object1Name);
            var obj2 = context?.GetObject(object2Name);
            if (obj1 == null || obj2 == null) return 0f;

            return Vector3.Distance(obj1.GetPosition(), obj2.GetPosition());
        }
    }
}
