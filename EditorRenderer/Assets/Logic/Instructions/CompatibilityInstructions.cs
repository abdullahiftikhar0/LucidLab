using System;
using System.Collections.Generic;
using System.Globalization;
using Assets.Logic.Misc;
using Assets.PlayMode;
using UnityEngine;

namespace Assets.Logic.Instructions.Core
{
    public class GotoSceneInstruction : ExecInstruction
    {
        private const float RepeatSuppressionWindowSec = 0.5f;
        private static string _lastRequestedSceneName;
        private static float _lastRequestedSceneTime;

        public GotoSceneInstruction(Dictionary<string, InputParam> inputs, Dictionary<string, string> parms,
            Dictionary<string, ExecInstruction> nxtInstructions) : base(inputs, parms, nxtInstructions) { }

        public override object GetOutput(string outputName) => throw new NotImplementedException();

        protected override void ExecuteImpl()
        {
            var sceneName = inputs != null && inputs.TryGetValue("sceneName", out var sceneInput)
                ? sceneInput.GetValue()?.ToString()
                : null;
            if (string.IsNullOrWhiteSpace(sceneName)) return;

            sceneName = sceneName.Trim();
            if (sceneName.Length == 0) return;

            if (string.Equals(_lastRequestedSceneName, sceneName, StringComparison.Ordinal))
            {
                var now = Time.unscaledTime;
                if (now - _lastRequestedSceneTime < RepeatSuppressionWindowSec)
                {
                    return;
                }
            }

            _lastRequestedSceneName = sceneName;
            _lastRequestedSceneTime = Time.unscaledTime;

            ReactBridge.SendGotoSceneRequested(sceneName);
            Debug.Log($"[GotoSceneInstruction] Requested transition to scene '{sceneName}' in preview.");
        }
    }

    public class GetElapsedTimeInstruction : DataInstruction
    {
        public GetElapsedTimeInstruction(Dictionary<string, InputParam> inputs, Dictionary<string, string> controls)
            : base(inputs, controls) { }

        public override object GetOutput(string outputName)
        {
            if (outputName == "time") return Time.time;
            throw new NotImplementedException();
        }
    }

    public class GetTimeSinceLastLoopInstruction : DataInstruction
    {
        public GetTimeSinceLastLoopInstruction(Dictionary<string, InputParam> inputs, Dictionary<string, string> controls)
            : base(inputs, controls) { }

        public override object GetOutput(string outputName)
        {
            if (outputName == "time") return Time.fixedDeltaTime;
            throw new NotImplementedException();
        }
    }
}

namespace Assets.Logic.Instructions.Properties
{
    public class GetSpeedInstruction : DataInstruction
    {
        public GetSpeedInstruction(Dictionary<string, InputParam> inputs, Dictionary<string, string> controls)
            : base(inputs, controls) { }

        public override object GetOutput(string outputName)
        {
            if (outputName != "speed") throw new NotImplementedException();
            if (controls == null || !controls.TryGetValue("object", out var objName)) return 0f;
            var obj = GetContext()?.GetObject(objName);
            return obj?.GetSpeed() ?? 0f;
        }
    }

    public class SetBouncinessInstruction : ExecInstruction
    {
        public SetBouncinessInstruction(Dictionary<string, InputParam> inputs, Dictionary<string, string> parms,
            Dictionary<string, ExecInstruction> nxtInstructions) : base(inputs, parms, nxtInstructions) { }

        public override object GetOutput(string outputName) => throw new NotImplementedException();

        protected override void ExecuteImpl()
        {
            if (controls == null || !controls.TryGetValue("object", out var objName)) return;
            var obj = GetContext()?.GetObject(objName);
            if (obj == null) return;
            if (inputs == null || !inputs.TryGetValue("value", out var valueInput)) return;
            var value = valueInput.GetValue();
            if (value == null) return;
            obj.UpdateBounciness(Convert.ToSingle(value));
        }
    }

    public class SetMassInstruction : ExecInstruction
    {
        public SetMassInstruction(Dictionary<string, InputParam> inputs, Dictionary<string, string> parms,
            Dictionary<string, ExecInstruction> nxtInstructions) : base(inputs, parms, nxtInstructions) { }

        public override object GetOutput(string outputName) => throw new NotImplementedException();

        protected override void ExecuteImpl()
        {
            if (controls == null || !controls.TryGetValue("object", out var objName)) return;
            var obj = GetContext()?.GetObject(objName);
            if (obj == null) return;
            if (inputs == null || !inputs.TryGetValue("value", out var valueInput)) return;
            var value = valueInput.GetValue();
            if (value == null) return;
            obj.UpdateMass(Convert.ToSingle(value));
        }
    }
}

namespace Assets.Logic.Instructions.Actions
{
    public class SetVisibleInstruction : ExecInstruction
    {
        public SetVisibleInstruction(Dictionary<string, InputParam> inputs, Dictionary<string, string> parms,
            Dictionary<string, ExecInstruction> nxtInstructions) : base(inputs, parms, nxtInstructions) { }

        public override object GetOutput(string outputName) => throw new NotImplementedException();

        protected override void ExecuteImpl()
        {
            if (controls == null || !controls.TryGetValue("object", out var objName)) return;
            var obj = GetContext()?.GetObject(objName);
            if (obj == null) return;
            var visible = controls.TryGetValue("visible", out var visibleText) &&
                          string.Equals(visibleText, "True", StringComparison.OrdinalIgnoreCase);
            obj.UpdateVisible(visible);
        }
    }

    public class SetObjectDescriptionInstruction : ExecInstruction
    {
        public SetObjectDescriptionInstruction(Dictionary<string, InputParam> inputs, Dictionary<string, string> parms,
            Dictionary<string, ExecInstruction> nxtInstructions) : base(inputs, parms, nxtInstructions) { }

        public override object GetOutput(string outputName) => throw new NotImplementedException();

        protected override void ExecuteImpl()
        {
            if (controls == null || !controls.TryGetValue("object", out var objName)) return;
            var obj = GetContext()?.GetObject(objName);
            if (obj == null) return;
            var desc = inputs != null && inputs.TryGetValue("desc", out var descInput)
                ? descInput.GetValue()?.ToString() ?? string.Empty
                : string.Empty;
            obj.SetDescription(desc);
        }
    }

    public class ApplyForceOnObjectInstruction : ExecInstruction
    {
        public ApplyForceOnObjectInstruction(Dictionary<string, InputParam> inputs, Dictionary<string, string> parms,
            Dictionary<string, ExecInstruction> nxtInstructions) : base(inputs, parms, nxtInstructions) { }

        public override object GetOutput(string outputName) => throw new NotImplementedException();

        protected override void ExecuteImpl()
        {
            if (controls == null || !controls.TryGetValue("object", out var objName)) return;
            var obj = GetContext()?.GetObject(objName);
            if (obj == null) return;

            var x = inputs != null && inputs.TryGetValue("x", out var xInput) ? Convert.ToSingle(xInput.GetValue()) : 0f;
            var y = inputs != null && inputs.TryGetValue("y", out var yInput) ? Convert.ToSingle(yInput.GetValue()) : 0f;
            var z = inputs != null && inputs.TryGetValue("z", out var zInput) ? Convert.ToSingle(zInput.GetValue()) : 0f;

            obj.ApplyForce(new Vector3(x, y, z));
        }
    }
}

namespace Assets.Logic.Instructions.Misc
{
    public class SetColorRGBInstruction : ExecInstruction
    {
        public SetColorRGBInstruction(Dictionary<string, InputParam> inputs, Dictionary<string, string> parms,
            Dictionary<string, ExecInstruction> nxtInstructions) : base(inputs, parms, nxtInstructions) { }

        public override object GetOutput(string outputName) => throw new NotImplementedException();

        protected override void ExecuteImpl()
        {
            if (controls == null || !controls.TryGetValue("object", out var objName)) return;
            var obj = GetContext()?.GetObject(objName);
            if (obj == null) return;

            var r = inputs != null && inputs.TryGetValue("r", out var rInput) ? Convert.ToSingle(rInput.GetValue()) : 0f;
            var g = inputs != null && inputs.TryGetValue("g", out var gInput) ? Convert.ToSingle(gInput.GetValue()) : 0f;
            var b = inputs != null && inputs.TryGetValue("b", out var bInput) ? Convert.ToSingle(bInput.GetValue()) : 0f;
            obj.UpdateColor(r, g, b);
        }
    }

    public class EvalStringInstruction : DataInstruction
    {
        public EvalStringInstruction(Dictionary<string, InputParam> inputs, Dictionary<string, string> controls)
            : base(inputs, controls) { }

        public override object GetOutput(string outputName)
        {
            if (outputName != "output") throw new NotImplementedException();
            if (controls == null || !controls.TryGetValue("expression", out var expression)) return string.Empty;

            var answer = expression;
            if (inputs != null && inputs.TryGetValue("a", out var aInput))
                answer = answer.Replace("{a}", aInput.GetValue()?.ToString() ?? string.Empty);
            if (inputs != null && inputs.TryGetValue("b", out var bInput))
                answer = answer.Replace("{b}", bInput.GetValue()?.ToString() ?? string.Empty);
            return answer;
        }
    }

    public class EvalInstruction : DataInstruction
    {
        public EvalInstruction(Dictionary<string, InputParam> inputs, Dictionary<string, string> controls)
            : base(inputs, controls) { }

        public override object GetOutput(string outputName)
        {
            if (outputName != "output") throw new NotImplementedException();
            if (controls == null || !controls.TryGetValue("expression", out var expression) || string.IsNullOrWhiteSpace(expression))
                return 0f;

            var a = ReadFloatInput("a");
            var b = ReadFloatInput("b");

            if (!SimpleMathEvaluator.TryEvaluate(expression, a, b, out var result))
            {
                Debug.LogWarning($"[EvalInstruction] Failed to evaluate expression '{expression}'.");
                return 0f;
            }

            return result;
        }

        private float ReadFloatInput(string key)
        {
            if (inputs == null || !inputs.TryGetValue(key, out var input)) return 0f;
            var raw = input.GetValue();
            if (raw == null) return 0f;
            return Convert.ToSingle(raw);
        }

        private sealed class SimpleMathEvaluator
        {
            private readonly string _text;
            private readonly float _a;
            private readonly float _b;
            private int _index;

            private SimpleMathEvaluator(string text, float a, float b)
            {
                _text = text ?? string.Empty;
                _a = a;
                _b = b;
            }

            public static bool TryEvaluate(string expression, float a, float b, out float result)
            {
                try
                {
                    var parser = new SimpleMathEvaluator(expression, a, b);
                    result = parser.ParseExpression();
                    parser.SkipWhitespace();
                    if (parser._index != parser._text.Length)
                    {
                        result = 0f;
                        return false;
                    }
                    return true;
                }
                catch
                {
                    result = 0f;
                    return false;
                }
            }

            private float ParseExpression()
            {
                var value = ParseTerm();
                while (true)
                {
                    SkipWhitespace();
                    if (Match('+')) value += ParseTerm();
                    else if (Match('-')) value -= ParseTerm();
                    else break;
                }
                return value;
            }

            private float ParseTerm()
            {
                var value = ParseFactor();
                while (true)
                {
                    SkipWhitespace();
                    if (Match('*')) value *= ParseFactor();
                    else if (Match('/'))
                    {
                        var divisor = ParseFactor();
                        if (Mathf.Approximately(divisor, 0f)) return 0f;
                        value /= divisor;
                    }
                    else break;
                }
                return value;
            }

            private float ParseFactor()
            {
                SkipWhitespace();

                if (Match('+')) return ParseFactor();
                if (Match('-')) return -ParseFactor();

                if (Match('('))
                {
                    var value = ParseExpression();
                    Expect(')');
                    return value;
                }

                if (PeekLetter())
                {
                    var identifier = ParseIdentifier();
                    if (string.Equals(identifier, "a", StringComparison.OrdinalIgnoreCase)) return _a;
                    if (string.Equals(identifier, "b", StringComparison.OrdinalIgnoreCase)) return _b;
                    throw new FormatException($"Unknown identifier '{identifier}'.");
                }

                return ParseNumber();
            }

            private float ParseNumber()
            {
                SkipWhitespace();
                var start = _index;
                while (_index < _text.Length)
                {
                    var ch = _text[_index];
                    if ((ch >= '0' && ch <= '9') || ch == '.')
                    {
                        _index++;
                        continue;
                    }
                    break;
                }

                if (start == _index) throw new FormatException("Expected number.");

                var token = _text.Substring(start, _index - start);
                if (!float.TryParse(token, NumberStyles.Float, CultureInfo.InvariantCulture, out var value))
                    throw new FormatException($"Invalid number '{token}'.");
                return value;
            }

            private string ParseIdentifier()
            {
                var start = _index;
                while (_index < _text.Length)
                {
                    var ch = _text[_index];
                    if (char.IsLetterOrDigit(ch) || ch == '_')
                    {
                        _index++;
                        continue;
                    }
                    break;
                }
                return _text.Substring(start, _index - start);
            }

            private bool PeekLetter()
            {
                SkipWhitespace();
                return _index < _text.Length && char.IsLetter(_text[_index]);
            }

            private bool Match(char ch)
            {
                SkipWhitespace();
                if (_index >= _text.Length || _text[_index] != ch) return false;
                _index++;
                return true;
            }

            private void Expect(char ch)
            {
                if (!Match(ch)) throw new FormatException($"Expected '{ch}'.");
            }

            private void SkipWhitespace()
            {
                while (_index < _text.Length && char.IsWhiteSpace(_text[_index])) _index++;
            }
        }
    }

    public class GetVariableInstruction : DataInstruction
    {
        public GetVariableInstruction(Dictionary<string, InputParam> inputs, Dictionary<string, string> controls)
            : base(inputs, controls) { }

        public override object GetOutput(string outputName)
        {
            if (outputName != "value") throw new NotImplementedException();

            var logicManager = GetLogicManager();
            if (logicManager == null || controls == null || !controls.TryGetValue("var", out var varName)) return null;
            if (string.IsNullOrEmpty(varName)) return null;

            return logicManager.VariablesStore.TryGetValue(varName, out var value) ? value : null;
        }
    }

    public class SetVariableInstruction : ExecInstruction
    {
        public SetVariableInstruction(Dictionary<string, InputParam> inputs, Dictionary<string, string> parms,
            Dictionary<string, ExecInstruction> nxtInstructions) : base(inputs, parms, nxtInstructions) { }

        public override object GetOutput(string outputName) => throw new NotImplementedException();

        protected override void ExecuteImpl()
        {
            var logicManager = GetLogicManager();
            if (logicManager == null || controls == null || !controls.TryGetValue("var", out var varName)) return;
            if (string.IsNullOrEmpty(varName)) return;
            if (inputs == null || !inputs.TryGetValue("value", out var valueInput)) return;

            logicManager.VariablesStore[varName] = valueInput.GetValue();
        }
    }
}
