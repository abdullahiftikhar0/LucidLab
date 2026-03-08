# Play Mode: Run Real Scene Logic in WebGL

Play mode runs the **same C# logic** as the student APK (LucidLab), so you are not reimplementing nodes in JS.

## How it works

1. React sends the current `sceneLogic` as JSON when the teacher clicks **Play**.
2. Unity deserializes it and builds instructions with **LogicBuilder** (same as LucidLab).
3. **LogicContext.Current** is set to **EditorLogicContext**, which resolves objects via **ObjectManagement** (your existing scene objects).
4. **LogicManager** runs SceneLoad once and SceneLoop every FixedUpdate.

So every instruction (SetPosition, SetColor, Compare, etc.) runs in C# and drives your existing WebGL scene.

## One-time setup: copy Logic from LucidLab

1. Copy the entire folder **LucidLab/Assets/Logic** into **EditorRenderer/Assets/Logic** (so you have EditorRenderer/Assets/Logic/LogicBuilder.cs, Instructions/, Misc/, etc.).

2. In **EditorRenderer/Assets/Logic/Instructions/DataInstruction.cs**, replace the scene dependency with the play-mode context:

   **Remove:**
   ```csharp
   protected SceneManagement.SceneManager GetSceneManager() {
       var coreObj = GameObject.Find("CoreGameObject");
       return coreObj.GetComponent<SceneManagement.SceneManager>();
   }
   ```
   **Add:**
   ```csharp
   using Assets.PlayMode;
   protected ILogicContext GetContext() => LogicContext.Current;
   ```

3. In **every instruction** that calls `GetSceneManager().currentScene.GetObject(...)`, change to:
   ```csharp
   var obj = GetContext().GetObject(controls["object"]);  // or the relevant control name
   ```
   and use `obj` as **IPlayModeObject** (UpdatePosition, UpdateColor, etc.).  
   So replace `Object` with `IPlayModeObject` in those instructions.

4. Remove any **Firebase** or **SceneManagement** usings from the copied Logic; the only external dependency should be **Assets.PlayMode** (and UnityEngine).

5. Copy **LucidLab/Assets/SceneManagement/Models/SceneLogicData.cs** and **InputFromData** into EditorRenderer only if you need the Firestore-free models; **PlayMode/SceneLogicModels.cs** already defines the same shape for JSON.

6. In **LogicBuilder**, use **Assets.PlayMode.SceneLogicData** (or the local SceneLogicData you defined) so it matches the payload built in **PlayModeRunner**.

After that, **Play** in the browser will run the real logic; no manual list of nodes in the runner.

## Adding new node types later

When you add a new instruction in **LucidLab**, copy that instruction file into **EditorRenderer/Assets/Logic** and change any `GetSceneManager().currentScene.GetObject(...)` to `GetContext().GetObject(...)` and use **IPlayModeObject**. Add the new case in **LogicBuilder.CreateInstruction** so the new node type is built from the graph.

Optionally, move the shared Logic (and interfaces) into a **shared Unity assembly** so both LucidLab and EditorRenderer reference it and you only add new nodes in one place.
