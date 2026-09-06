using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Assets.Logic.Misc;
using UnityEngine;

namespace Assets.Logic.Instructions.Core {
    public class GotoSceneInstruction : ExecInstruction {
        public GotoSceneInstruction(Dictionary<string, InputParam> inputs, Dictionary<string, string> parms, Dictionary<string, ExecInstruction> nxtInstructions) : base(inputs, parms, nxtInstructions) { }
        public override object GetOutput(string outputName) {
            throw new NotImplementedException();
        }

        protected override void ExecuteImpl() {
            var sceneManager = GetSceneManager();
            var sceneName = inputs["sceneName"].GetValue().ToString();
            var sceneData = sceneManager.sceneLoader.GetSceneWithName(sceneName);
            if (sceneData == null) {
                Debug.LogWarning($"[GotoSceneInstruction] Scene '{sceneName}' was not found. Ignoring transition.");
                return;
            }

            _ = sceneManager.SetCurrentScene(sceneData);
        }
    }
}
