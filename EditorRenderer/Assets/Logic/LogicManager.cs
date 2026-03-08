using System.Collections.Generic;
using Assets.Logic.Instructions;
using UnityEngine;

namespace Assets.Logic
{
    public class LogicManager : MonoBehaviour
    {
        private ExecInstruction[] _startInstructions;
        private ExecInstruction[] _loopInstructions;

        public Dictionary<string, object> VariablesStore = new Dictionary<string, object>();
        public bool HasStartedExecuting { get; private set; }

        public void InitLogicManager(ExecInstruction[] startInstructs, ExecInstruction[] loopInstructs)
        {
            HasStartedExecuting = false;
            _startInstructions = startInstructs ?? new ExecInstruction[0];
            _loopInstructions = loopInstructs ?? new ExecInstruction[0];
        }

        public void StartExecuting()
        {
            foreach (var instruction in _startInstructions)
                instruction?.Execute();
            HasStartedExecuting = true;
        }

        public void StopExecuting()
        {
            HasStartedExecuting = false;
        }

        void FixedUpdate()
        {
            if (!HasStartedExecuting || _loopInstructions == null) return;
            foreach (var instruction in _loopInstructions)
                instruction?.Execute();
        }
    }
}
