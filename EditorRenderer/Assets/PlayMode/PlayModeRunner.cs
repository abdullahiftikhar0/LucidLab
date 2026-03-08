using System;
using System.Collections.Generic;
using Assets.Logic;
using Assets.Logic.Instructions;
using UnityEngine;

namespace Assets.PlayMode
{
    /// <summary>
    /// Receives StartSimulation(json) and StopSimulation from React, runs the real C# logic (same as APK).
    /// Attach to the same GameObject as ObjectManagement (e.g. SceneController).
    /// </summary>
    public class PlayModeRunner : MonoBehaviour
    {
        private ObjectManagement _objectManagement;
        private LogicManager _logicManager;

        void Awake()
        {
            _objectManagement = GetComponent<ObjectManagement>();
            _logicManager = GetComponent<LogicManager>();
            if (_logicManager == null)
                _logicManager = gameObject.AddComponent<LogicManager>();
        }

        /// <summary>Called from React via sendMessage("SceneController", "StartSimulation", jsonPayload)</summary>
        public void StartSimulation(string json)
        {
            if (_objectManagement == null || string.IsNullOrEmpty(json))
            {
                Debug.LogWarning("[PlayModeRunner] StartSimulation: no ObjectManagement or empty JSON.");
                return;
            }

            StopSimulation("");

            try
            {
                var payload = JsonUtility.FromJson<SceneLogicPayload>(json);
                if (payload?.nodes == null || payload.nodes.Length == 0)
                {
                    Debug.LogWarning("[PlayModeRunner] No nodes in payload.");
                    return;
                }

                var logicData = PayloadToLogicData(payload);
                if (logicData.Count == 0)
                {
                    Debug.LogWarning("[PlayModeRunner] Could not build logic data.");
                    return;
                }

                LogicContext.Current = new EditorLogicContext(_objectManagement);

                var builder = new LogicBuilder(logicData);
                var instructions = builder.GetInstructions();

                var startList = new List<ExecInstruction>();
                var loopList = new List<ExecInstruction>();
                foreach (var i in instructions)
                {
                    if (i is ExecInstruction exec)
                    {
                        if (exec.IsStartInstruction) startList.Add(exec);
                        if (exec.IsLoopInstruction) loopList.Add(exec);
                    }
                }

                _logicManager.InitLogicManager(startList.ToArray(), loopList.ToArray());
                _logicManager.StartExecuting();
                Debug.Log($"[PlayModeRunner] Started. Start instructions: {startList.Count}, Loop: {loopList.Count}");
            }
            catch (Exception e)
            {
                Debug.LogError($"[PlayModeRunner] StartSimulation failed: {e.Message}\n{e.StackTrace}");
                LogicContext.Current = null;
            }
        }

        /// <summary>Called from React via sendMessage("SceneController", "StopSimulation", "")</summary>
        public void StopSimulation(string _)
        {
            if (_logicManager != null)
                _logicManager.StopExecuting();
            LogicContext.Current = null;
            Debug.Log("[PlayModeRunner] Stopped.");
        }

        static Dictionary<string, string> KeyValToDict(KeyVal[] arr)
        {
            var d = new Dictionary<string, string>();
            if (arr == null) return d;
            foreach (var kv in arr)
                if (!string.IsNullOrEmpty(kv?.key))
                    d[kv.key] = kv?.value ?? "";
            return d;
        }

        static Dictionary<string, InputFromData> InputFromToDict(InputFromEntry[] arr)
        {
            var d = new Dictionary<string, InputFromData>();
            if (arr == null) return d;
            foreach (var e in arr)
            {
                if (string.IsNullOrEmpty(e?.key)) continue;
                d[e.key] = new InputFromData { nodeId = e.nodeId ?? "", outputName = e.outputName ?? "" };
            }
            return d;
        }

        static Dictionary<string, SceneLogicData> PayloadToLogicData(SceneLogicPayload payload)
        {
            var logicData = new Dictionary<string, SceneLogicData>();
            if (payload?.nodes == null) return logicData;

            foreach (var n in payload.nodes)
            {
                if (string.IsNullOrEmpty(n?.id)) continue;
                logicData[n.id] = new SceneLogicData
                {
                    name = n.name ?? "",
                    position = null,
                    controls = KeyValToDict(n.controls),
                    execOutputs = KeyValToDict(n.execOutputs),
                    inputValues = KeyValToDict(n.inputValues),
                    inputsFrom = InputFromToDict(n.inputsFrom)
                };
            }
            return logicData;
        }
    }
}
