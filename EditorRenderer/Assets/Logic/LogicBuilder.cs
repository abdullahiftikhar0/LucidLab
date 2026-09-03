using System;
using System.Collections.Generic;
using Assets.Logic.Instructions;
using Assets.Logic.Instructions.Actions;
using Assets.Logic.Instructions.Core;
using Assets.Logic.Instructions.Deciders;
using Assets.Logic.Instructions.Misc;
using Assets.Logic.Instructions.Properties;
using Assets.Logic.Misc;
using Assets.PlayMode;

namespace Assets.Logic
{
    public class LogicBuilder
    {
        private readonly Dictionary<string, SceneLogicData> _logicData;
        private readonly Dictionary<string, DataInstruction> _cache;

        public LogicBuilder(Dictionary<string, SceneLogicData> logicData)
        {
            _logicData = logicData ?? new Dictionary<string, SceneLogicData>();
            _cache = new Dictionary<string, DataInstruction>();
        }

        private static DataInstruction CreateInstruction(string type,
            ref Dictionary<string, string> controls,
            ref Dictionary<string, InputParam> inputs,
            ref Dictionary<string, ExecInstruction> nextInstructs)
        {
            return type switch
            {
                "SceneLoad" => new SceneLoadInstruction(inputs, controls, nextInstructs),
                "SceneLoop" => new SceneLoopInstruction(inputs, controls, nextInstructs),
                "SetPosition" => new SetPositionInstruction(inputs, controls, nextInstructs),
                "SetRotation" => new SetRotationInstruction(inputs, controls, nextInstructs),
                "SetScale" => new SetScaleInstruction(inputs, controls, nextInstructs),
                "SetColor" => new SetColorInstruction(inputs, controls, nextInstructs),
                "Compare" => new CompareInstruction(inputs, controls, nextInstructs),
                "ShowMessage" => new ShowMessageInstruction(inputs, controls, nextInstructs),
                "GetPosition" => new GetPositionInstruction(inputs, controls),
                "GetRotation" => new GetRotationInstruction(inputs, controls),
                "GetScale" => new GetScaleInstruction(inputs, controls),
                "SetStaticFriction" => new SetStaticFrictionInstruction(inputs, controls, nextInstructs),
                "SetDynamicFriction" => new SetDynamicFrictionInstruction(inputs, controls, nextInstructs),
                _ => throw new Exception($"Unknown node type '{type}'. Copy the instruction from LucidLab into EditorRenderer/Assets/Logic.")
            };
        }

        private DataInstruction ConvertInstruction(string id, SceneLogicData logicNode)
        {
            if (_cache.TryGetValue(id, out var instruction)) return instruction;

            var controls = logicNode.controls ?? new Dictionary<string, string>();
            var execOutputs = logicNode.execOutputs ?? new Dictionary<string, string>();
            var inputValues = logicNode.inputValues ?? new Dictionary<string, string>();
            var inputsFrom = logicNode.inputsFrom ?? new Dictionary<string, InputFromData>();

            var inputs = new Dictionary<string, InputParam>();
            var nextInstructs = new Dictionary<string, ExecInstruction>();

            foreach (var pair in execOutputs)
            {
                if (_logicData.TryGetValue(pair.Value, out var nextNode))
                    nextInstructs[pair.Key] = (ExecInstruction)ConvertInstruction(pair.Value, nextNode);
            }

            foreach (var pair in inputValues)
            {
                var inst = new ConstantValueInstruction(new Dictionary<string, InputParam>(),
                    new Dictionary<string, string> { { "value", pair.Value } });
                inputs[pair.Key] = new InputParam(inst, "value");
            }

            foreach (var pair in inputsFrom)
            {
                if (_logicData.TryGetValue(pair.Value.nodeId, out var fromNode))
                {
                    var dtaInstruction = ConvertInstruction(pair.Value.nodeId, fromNode);
                    inputs[pair.Key] = new InputParam(dtaInstruction, pair.Value.outputName);
                }
            }

            _cache[id] = CreateInstruction(logicNode.name, ref controls, ref inputs, ref nextInstructs);
            return _cache[id];
        }

        public DataInstruction[] GetInstructions()
        {
            foreach (var kv in _logicData)
                ConvertInstruction(kv.Key, kv.Value);
            var arr = new DataInstruction[_cache.Count];
            _cache.Values.CopyTo(arr, 0);
            return arr;
        }
    }
}
