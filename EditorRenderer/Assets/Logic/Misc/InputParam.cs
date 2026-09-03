using System;
using Assets.Logic.Instructions;

namespace Assets.Logic.Misc
{
    public class InputParam
    {
        private readonly DataInstruction _instruction;
        private readonly string _paramName;

        public InputParam(DataInstruction instruction, string paramName)
        {
            _instruction = instruction;
            _paramName = paramName;
        }

        public object GetValue() => _instruction.GetOutput(_paramName);
    }
}
