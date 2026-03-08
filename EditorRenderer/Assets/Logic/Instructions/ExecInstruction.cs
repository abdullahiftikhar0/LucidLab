using System;
using System.Collections.Generic;
using System.Linq;
using Assets.Logic.Misc;
using UnityEngine;

namespace Assets.Logic.Instructions
{
    public abstract class ExecInstruction : DataInstruction
    {
        public virtual bool IsStartInstruction => false;
        public virtual bool IsLoopInstruction => false;

        protected readonly Dictionary<string, ExecInstruction> nextInstructions;

        protected ExecInstruction(Dictionary<string, InputParam> inputs, Dictionary<string, string> parms,
            Dictionary<string, ExecInstruction> nxtInstructions) : base(inputs, parms)
        {
            nextInstructions = nxtInstructions ?? new Dictionary<string, ExecInstruction>();
        }

        protected abstract void ExecuteImpl();

        public virtual void Execute()
        {
            ExecuteImpl();
            if (nextInstructions != null && nextInstructions.TryGetValue("exec", out var next))
                next?.Execute();
        }
    }
}
