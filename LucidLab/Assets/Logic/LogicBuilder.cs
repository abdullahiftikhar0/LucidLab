using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Assets.Logic.Instructions;
using Assets.Logic.Instructions.Actions;
using Assets.Logic.Instructions.Core;
using Assets.Logic.Instructions.Deciders;
using Assets.Logic.Instructions.Misc;
using Assets.Logic.Instructions.Mutators;
using Assets.Logic.Instructions.Properties;
using Assets.Logic.Instructions.Variables;
using Assets.Logic.Misc;
using Assets.SceneManagement.Models;
using UnityEngine;

namespace Assets.Logic {
    public class LogicBuilder {

        private readonly Dictionary<string, SceneLogicData> _logicData;
        private readonly Dictionary<string, DataInstruction> _cache;
        private readonly HashSet<string> _building;

        public LogicBuilder(Dictionary<string, SceneLogicData> logicData) {
            _logicData = logicData ?? new Dictionary<string, SceneLogicData>();
            _cache = new Dictionary<string, DataInstruction>();
            _building = new HashSet<string>();
        }

        private static DataInstruction CreateInstruction(string type, ref Dictionary<string, string> controls,
            ref Dictionary<string, InputParam> inputs, ref Dictionary<string, ExecInstruction> nextInstructs) {
            return type switch {
                "SetPosition" => new SetPositionInstruction(inputs, controls, nextInstructs),
                "SetRotation" => new SetRotationInstruction(inputs, controls, nextInstructs),
                "SetScale" => new SetScaleInstruction(inputs, controls, nextInstructs),
                "SceneLoop" => new SceneLoopInstruction(inputs, controls, nextInstructs),
                "SceneLoad" => new SceneLoadInstruction(inputs, controls, nextInstructs),
                "Compare" => new CompareInstruction(inputs, controls, nextInstructs),
                "SetVisible" => new SetVisibleInstruction(inputs, controls, nextInstructs),
                "GetPosition" => new GetPositionInstruction(inputs, controls),
                "GetRotation" => new GetRotationInstruction(inputs, controls),
                "GetScale" => new GetScaleInstruction(inputs, controls),
                "Eval" => new EvalInstruction(inputs, controls),
                "SetBounciness" => new SetBouncinessInstruction(inputs, controls, nextInstructs),
                "SetStaticFriction" => new SetStaticFrictionInstruction(inputs, controls, nextInstructs),
                "SetDynamicFriction" => new SetDynamicFrictionInstruction(inputs, controls, nextInstructs),
                "SetMass" => new SetMassInstruction(inputs, controls, nextInstructs),
                "GetElapsedTime" => new GetElapsedTimeInstruction(inputs, controls),
                "SetVariable" => new SetVariableInstruction(inputs, controls, nextInstructs),
                "GetVariable" => new GetVariableInstruction(inputs, controls),
                "GetSpeed" => new GetSpeedInstruction(inputs, controls),
                "EvalString" => new EvalStringInstruction(inputs, controls),
                "GetTimeSinceLastLoop" => new GetTimeSinceLastLoopInstruction(inputs, controls),
                "ShowMessage" => new ShowMessageInstruction(inputs, controls, nextInstructs),
                "SetObjectDescription" => new SetObjectDescriptionInstruction(inputs, controls, nextInstructs),
                "ApplyForceOnObject" => new ApplyForceOnObjectInstruction(inputs, controls, nextInstructs),
                "GotoScene" => new GotoSceneInstruction(inputs, controls, nextInstructs),
                "SetColor" => new SetColorInstruction(inputs, controls, nextInstructs),
                "SetColorRGB" => new SetColorRGBInstruction(inputs, controls, nextInstructs),
                "GetDistanceBetween" => new GetDistanceBetweenInstruction(inputs, controls),
                _ => null
            };
        }

        private DataInstruction ConvertInstruction(string id) {
            if (string.IsNullOrWhiteSpace(id)) return null;
            if (_cache.TryGetValue(id, out var instruction)) return instruction;

            if (!_logicData.TryGetValue(id, out var logicNode) || logicNode == null) {
                Debug.LogWarning($"[LogicBuilder] Node id '{id}' was referenced but not found. Skipping.");
                return null;
            }

            if (_building.Contains(id)) {
                Debug.LogWarning($"[LogicBuilder] Cycle detected while building node '{id}'. Skipping recursive edge.");
                return null;
            }

            _building.Add(id);
            try {
                var controls = logicNode.controls ?? new Dictionary<string, string>();

                Dictionary<string, InputParam> inputs = new();
                Dictionary<string, ExecInstruction> nextInstructs = new();

                foreach (var pair in logicNode.execOutputs ?? new Dictionary<string, string>()) {
                    var nextInstruction = ConvertInstruction(pair.Value);
                    if (nextInstruction is ExecInstruction execInstruction) {
                        nextInstructs[pair.Key] = execInstruction;
                    }
                }

                foreach (var pair in logicNode.inputValues ?? new Dictionary<string, string>()) {
                    var inst = new ConstantValueInstruction(new Dictionary<string, InputParam>(),
                        new Dictionary<string, string>() { { "value", pair.Value } });
                    inputs[pair.Key] = new InputParam(inst, "value");
                }

                foreach (var pair in logicNode.inputsFrom ?? new Dictionary<string, InputFromData>()) {
                    if (pair.Value == null) continue;
                    var dtaInstruction = ConvertInstruction(pair.Value.nodeId);
                    if (dtaInstruction == null) continue;
                    inputs[pair.Key] = new InputParam(dtaInstruction, pair.Value.outputName);
                }

                var built = CreateInstruction(logicNode.name, ref controls, ref inputs, ref nextInstructs);
                if (built == null) {
                    Debug.LogWarning($"[LogicBuilder] Unknown node type '{logicNode.name}' for node '{id}'. Skipping.");
                    return null;
                }

                _cache[id] = built;
                return built;
            } finally {
                _building.Remove(id);
            }
        }

        public DataInstruction[] GetInstructions() {
            if (_logicData.Count == 0) return Array.Empty<DataInstruction>();

            foreach (var logicItem in _logicData) {
                ConvertInstruction(logicItem.Key);
            }

            return _cache.Values.ToArray();
        }
    }
}
