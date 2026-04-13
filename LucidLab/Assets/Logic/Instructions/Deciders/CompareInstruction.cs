using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Assets.Logic.Misc;
using UnityEngine;

namespace Assets.Logic.Instructions.Deciders {
    public class CompareInstruction : ExecInstruction {
        public CompareInstruction(Dictionary<string, InputParam> inputs, Dictionary<string, string> parms,
            Dictionary<string, ExecInstruction> nxtInstructions) : base(inputs, parms, nxtInstructions) { }

        public override object GetOutput(string outputName) {
            throw new NotImplementedException();
        }

        protected override void ExecuteImpl() { }

        private static bool TryToFloat(object value, out float parsed) {
            if (value is null) {
                parsed = 0f;
                return false;
            }

            switch (value) {
                case float f:
                    parsed = f;
                    return true;
                case double d:
                    parsed = (float)d;
                    return true;
                case int i:
                    parsed = i;
                    return true;
                case long l:
                    parsed = l;
                    return true;
                default:
                    return float.TryParse(value.ToString(), out parsed);
            }
        }

        public override void Execute() {
            if (!inputs.TryGetValue("left", out var leftInput) || !inputs.TryGetValue("right", out var rightInput)) {
                Debug.LogWarning("[CompareInstruction] Missing left/right inputs. Skipping.");
                return;
            }

            object leftRaw;
            object rightRaw;

            try {
                leftRaw = leftInput.GetValue();
                rightRaw = rightInput.GetValue();
            } catch (Exception e) {
                Debug.LogWarning($"[CompareInstruction] Failed reading inputs: {e.Message}");
                return;
            }

            int compare;
            if (TryToFloat(leftRaw, out var leftNum) && TryToFloat(rightRaw, out var rightNum)) {
                compare = leftNum.CompareTo(rightNum);
            } else {
                var leftText = leftRaw?.ToString() ?? string.Empty;
                var rightText = rightRaw?.ToString() ?? string.Empty;
                compare = string.CompareOrdinal(leftText, rightText);
            }

            switch (compare) {
                case 0:
                    nextInstructions.GetValueOrDefault("equal")?.Execute();
                    break;
                case < 0:
                    nextInstructions.GetValueOrDefault("lessthan")?.Execute();
                    break;
                case > 0:
                    nextInstructions.GetValueOrDefault("biggerthan")?.Execute();
                    break;
            }
        }
    }
}