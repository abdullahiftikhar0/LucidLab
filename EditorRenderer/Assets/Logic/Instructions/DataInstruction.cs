using System;
using System.Collections.Generic;
using Assets.Logic.Misc;
using Assets.PlayMode;
using UnityEngine;

namespace Assets.Logic.Instructions
{
    public abstract class DataInstruction
    {
        protected readonly Dictionary<string, string> controls;
        protected readonly Dictionary<string, InputParam> inputs;

        protected DataInstruction(Dictionary<string, InputParam> inputs, Dictionary<string, string> controls)
        {
            this.inputs = inputs;
            this.controls = controls;
        }

        public abstract object GetOutput(string outputName);

        protected ILogicContext GetContext() => LogicContext.Current;

        protected Assets.Logic.LogicManager GetLogicManager() => UnityEngine.Object.FindObjectOfType<Assets.Logic.LogicManager>();
    }
}
