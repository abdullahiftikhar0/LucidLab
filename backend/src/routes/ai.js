const express = require("express");
const { chatJson, chatCompletion } = require("../services/openai");
const { requireAuth } = require("../middleware/auth");

const APPLY_SCENE_LOGIC_TOOL = {
  type: "function",
  function: {
    name: "apply_scene_logic",
    description:
      "Generate or update the visual logic graph for the scene. Call when the user asks to build, change, fix, or extend scene behavior, interactions, triggers, or logic nodes.",
    parameters: {
      type: "object",
      properties: {
        instruction: {
          type: "string",
          description:
            "Clear instruction for what the logic graph should do, including objects involved.",
        },
      },
      required: ["instruction"],
    },
  },
};

const router = express.Router();

function isPlainObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function hasNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

function hasObjectTarget(node) {
  if (!isPlainObject(node)) return false;

  if (isPlainObject(node.controls) && hasNonEmptyString(node.controls.object)) {
    return true;
  }

  if (isPlainObject(node.inputValues) && hasNonEmptyString(node.inputValues.object)) {
    return true;
  }

  if (isPlainObject(node.inputsFrom) && isPlainObject(node.inputsFrom.object)) {
    return true;
  }

  return false;
}

const CURRENT_LOGIC_JSON_LIMIT = 12000;

const OBJECT_TARGET_NODE_TYPES = new Set([
  "SetColor",
  "SetColorRGB",
  "SetVisible",
  "SetPosition",
  "SetRotation",
  "SetScale",
  "SetMass",
  "SetBounciness",
  "SetStaticFriction",
  "SetDynamicFriction",
  "SetObjectDescription",
  "ApplyForceOnObject",
  "GetPosition",
  "GetRotation",
  "GetScale",
  "GetSpeed",
]);

const OBJECT_CONTROL_KEY_ALIASES = [
  "object",
  "Object Name",
  "ObjectName",
  "objectName",
  "target",
  "targetObject",
];

function needsObjectTarget(nodeName) {
  return OBJECT_TARGET_NODE_TYPES.has(nodeName);
}

function copyObjectTarget(fromNode, toNode) {
  if (!isPlainObject(fromNode) || !isPlainObject(toNode)) return;

  if (!isPlainObject(toNode.controls)) toNode.controls = {};
  if (isPlainObject(fromNode.controls) && hasNonEmptyString(fromNode.controls.object)) {
    toNode.controls.object = fromNode.controls.object;
  }

  if (!isPlainObject(toNode.inputValues)) toNode.inputValues = {};
  if (
    !hasObjectTarget(toNode) &&
    isPlainObject(fromNode.inputValues) &&
    hasNonEmptyString(fromNode.inputValues.object)
  ) {
    toNode.inputValues.object = fromNode.inputValues.object;
  }

  if (
    !hasObjectTarget(toNode) &&
    isPlainObject(fromNode.inputsFrom) &&
    isPlainObject(fromNode.inputsFrom.object)
  ) {
    if (!isPlainObject(toNode.inputsFrom)) toNode.inputsFrom = {};
    toNode.inputsFrom.object = { ...fromNode.inputsFrom.object };
  }
}

function normalizeObjectControlKeys(node) {
  if (!isPlainObject(node.controls)) return;

  for (const alias of OBJECT_CONTROL_KEY_ALIASES) {
    if (alias === "object") continue;
    if (hasNonEmptyString(node.controls[alias]) && !hasNonEmptyString(node.controls.object)) {
      node.controls.object = node.controls[alias];
    }
    if (alias !== "object") {
      delete node.controls[alias];
    }
  }
}

function repairExportedNodes(nodes, { baseline, objects }) {
  if (!isPlainObject(nodes)) return;

  normalizeExportedNodes(nodes);

  for (const n of Object.values(nodes)) {
    if (isPlainObject(n)) normalizeObjectControlKeys(n);
  }

  if (isPlainObject(baseline)) {
    for (const [id, n] of Object.entries(nodes)) {
      if (!needsObjectTarget(n.name) || hasObjectTarget(n)) continue;
      const prev = baseline[id];
      if (prev && needsObjectTarget(prev.name)) {
        copyObjectTarget(prev, n);
      }
    }

    const baselineSetColors = Object.entries(baseline).filter(
      ([, n]) => n.name === "SetColor" && hasObjectTarget(n),
    );
    const missingSetColors = Object.entries(nodes).filter(
      ([, n]) => n.name === "SetColor" && !hasObjectTarget(n),
    );

    for (const [id, n] of missingSetColors) {
      const sameId = baseline[id];
      if (sameId?.name === "SetColor" && hasObjectTarget(sameId)) {
        copyObjectTarget(sameId, n);
        continue;
      }
      const fuzzy = baselineSetColors.find(
        ([bid]) => bid === id || id.startsWith(bid) || bid.startsWith(id),
      );
      if (fuzzy) copyObjectTarget(fuzzy[1], n);
    }

    if (missingSetColors.length > 0 && baselineSetColors.length === 1) {
      const [, ref] = baselineSetColors[0];
      for (const [, n] of missingSetColors) {
        if (!hasObjectTarget(n)) copyObjectTarget(ref, n);
      }
    }
  }

  if (Array.isArray(objects)) {
    for (const n of Object.values(nodes)) {
      if (n.name !== "SetColor" || hasObjectTarget(n)) continue;
      if (objects.length === 1 && hasNonEmptyString(objects[0].objectName)) {
        if (!isPlainObject(n.controls)) n.controls = {};
        n.controls.object = objects[0].objectName;
      }
    }
  }

  normalizeExportedNodes(nodes);
}

const NODE_TYPES = new Set([
  "SceneLoad",
  "SceneLoop",
  "GotoScene",
  "ShowMessage",
  "Compare",
  "Eval",
  "GetPosition",
  "GetRotation",
  "GetScale",
  "SetPosition",
  "SetRotation",
  "SetScale",
  "SetVisible",
  "SetBounciness",
  "SetStaticFriction",
  "SetDynamicFriction",
  "SetMass",
  "SetObjectDescription",
  "GetVariable",
  "SetVariable",
  "EvalString",
  "ApplyForceOnObject",
  "GetSpeed",
  "GetTimeSinceLastLoop",
  "GetElapsedTime",
  "SetColor",
  "GetDistanceBetween",
  "SetColorRGB",
]);

function validateExportedNodes(nodes) {
  if (!isPlainObject(nodes)) return { ok: false, error: "sceneLogic must be an object map" };
  for (const [id, n] of Object.entries(nodes)) {
    if (!id) return { ok: false, error: "node id is empty" };
    if (!isPlainObject(n)) return { ok: false, error: `node '${id}' is not an object` };
    if (!NODE_TYPES.has(n.name)) return { ok: false, error: `unknown node type '${n.name}'` };
    if (!Array.isArray(n.position) || n.position.length !== 2) return { ok: false, error: `node '${id}' position invalid` };
    for (const k of ["controls", "execOutputs", "inputValues", "inputsFrom"]) {
      if (!isPlainObject(n[k])) return { ok: false, error: `node '${id}' ${k} invalid` };
    }

    // Prevent invalid color actions from reaching runtime.
    if (n.name === "SetColor" && !hasObjectTarget(n)) {
      return {
        ok: false,
        error: `node '${id}' (SetColor) is missing target object (controls.object or object input)`,
      };
    }

    if (n.name === "SetColor" && !hasNonEmptyString(n.controls.color)) {
      return {
        ok: false,
        error: `node '${id}' (SetColor) is missing controls.color`,
      };
    }
  }
  return { ok: true };
}

// Best-effort cleanup for small, mechanical JSON glitches from the model.
// IMPORTANT: keep this conservative – only fix patterns we know are safe.
function sanitizeJsonText(text) {
  if (typeof text !== "string" || text.length === 0) return text;

  let cleaned = text;

  // Fix accidental double quotes before a key name, e.g. ""position": [...] -> "position": [...]
  // This is exactly what we see in the failing sample.
  cleaned = cleaned.replace(/""([A-Za-z0-9_]+)"/g, '"$1"');

  // Very common model glitch: trailing commas before } or ].
  // Example: { "a": 1, } or [1, 2, ].
  cleaned = cleaned.replace(/,\s*([}\]])/g, "$1");

  return cleaned;
}

// Fix common small mismatches in model output so it better matches our node graph.
function normalizeExportedNodes(nodes) {
  if (!isPlainObject(nodes)) return;
  for (const [id, n] of Object.entries(nodes)) {
    if (!isPlainObject(n)) continue;

    // SceneLoad: ensure execOutputs key is exactly "exec"
    if (n.name === "SceneLoad" && isPlainObject(n.execOutputs)) {
      const keys = Object.keys(n.execOutputs);
      if (keys.length === 1 && keys[0] !== "exec") {
        const target = n.execOutputs[keys[0]];
        n.execOutputs = { exec: target };
      }
    }

    // SetColor: ensure color is in controls.color (not inputValues.color)
    if (n.name === "SetColor") {
      if (!isPlainObject(n.controls)) n.controls = {};
      if (isPlainObject(n.inputValues) && n.inputValues.color && !n.controls.color) {
        n.controls.color = n.inputValues.color;
        delete n.inputValues.color;
      }
    }
  }
}

function buildSystemPrompt({ objects, currentSceneLogic }) {
  const objLines =
    Array.isArray(objects) && objects.length > 0
      ? objects
          .map((o) => `- ${o.objectName} (type=${o.objectType})`)
          .join("\n")
      : "- (no objects)";

  let currentLogicSection = "Current scene logic: none.";
  if (isPlainObject(currentSceneLogic) && Object.keys(currentSceneLogic).length > 0) {
    // Keep this reasonably small to avoid blowing up the prompt.
    const asString = JSON.stringify(currentSceneLogic, null, 2);
    const truncated =
      asString.length > CURRENT_LOGIC_JSON_LIMIT
        ? asString.slice(0, CURRENT_LOGIC_JSON_LIMIT) + "\n... (truncated) ..."
        : asString;
    currentLogicSection = [
      "Current scene logic (ExportedNodes JSON). This is the graph you should UPDATE or EXTEND when the user prompt sounds like a modification:",
      "[CURRENT_SCENE_LOGIC_JSON_START]",
      truncated,
      "[CURRENT_SCENE_LOGIC_JSON_END]",
    ].join("\n");
  }

  return [
    "You are an expert visual-logic designer for LucidLab.",
    "You must output ONLY valid JSON (no markdown, no commentary).",
    "Your output must be an ExportedNodes map keyed by nodeId:",
    "{ [nodeId]: { name, position:[x,y], controls:{}, execOutputs:{}, inputValues:{}, inputsFrom:{} } }",
    "",
    "Allowed node types (name):",
    Array.from(NODE_TYPES).sort().map((t) => `- ${t}`).join("\n"),
    "",
    "Scene objects available (must refer to these exact names in controls like controls.object):",
    objLines,
    "",
    currentLogicSection,
    "",
    "Rules:",
    "- Always include a SceneLoad node, and (if continuous behavior is needed) a SceneLoop node.",
    "- Use execOutputs to chain execution; use inputsFrom for data connections.",
    "- Use GetDistanceBetween + Compare to detect 'touch' (distance threshold) if no collision node exists.",
    "- Use SetVisible (false) to 'disappear'. Use SetColor to change color (hex string, with or without '#').",
    "- SetColor must ALWAYS include controls.object (exact key \"object\") AND controls.color (exact key \"color\").",
    "- NEVER use UI labels like \"Object Name\" as JSON keys — only \"object\" and \"color\".",
    "- When editing an existing graph, keep the same controls.object on each node as in the current logic unless the user explicitly changes the target object.",
    "- If you only change a color, update controls.color but COPY controls.object from the existing node with the same nodeId.",
    "- Prefer simple logic that matches the user's intent.",
    "",
    "Object naming / reference rules:",
    "- The engine executes logic against scene OBJECT NAMES (objectName), not natural-language labels.",
    "- Users may refer to objects by their TYPE or a natural word in the prompt (e.g. 'cow') while the actual objectName is different (e.g. 'co').",
    "- When the prompt clearly references an object type or description that matches exactly one available object, you MUST use that object's objectName in controls.object.",
    "- Example: if the user says 'when the cow touches the human' and the only object with type='cow' is objectName='co', you must use controls.object='co' for that cow.",
    "- Never invent new object names; always choose from the listed objectName values, selecting the best match based on the prompt.",
    "",
    "Graph editing rules:",
    "- Treat the provided current scene logic as the starting point when the user's prompt sounds like a modification or extension (e.g. 'also make the cow jump', 'change this to...').",
    "- In such cases, UPDATE or EXTEND the existing graph instead of recreating it from scratch, reusing nodeIds where reasonable.",
    "- You may add or remove nodes and change connections as needed to satisfy the new prompt, but the final output must still be a full ExportedNodes map (not a diff).",
  ].join("\n");
}

function buildAssistantSystemPrompt({ objects, currentSceneLogic }) {
  const objLines =
    Array.isArray(objects) && objects.length > 0
      ? objects.map((o) => `- ${o.objectName} (type=${o.objectType})`).join("\n")
      : "- (no objects)";

  const hasLogic =
    isPlainObject(currentSceneLogic) && Object.keys(currentSceneLogic).length > 0;

  return [
    "You are the LucidLab AI assistant embedded in a scene editor with a visual logic graph.",
    "You help users design AR experiments: scene objects, behaviors, and node-based logic.",
    "",
    "Scene objects:",
    objLines,
    "",
    hasLogic
      ? "This scene already has logic. Prefer extending or editing it when the user asks for behavior changes."
      : "This scene has no logic yet.",
    "",
    "When the user asks you to BUILD, CHANGE, FIX, or EXTEND scene behavior (interactions, triggers, movement, visibility, colors, etc.), call the apply_scene_logic tool with a clear instruction.",
    "When the user asks general questions (explain nodes, brainstorm, how something works, what objects exist), reply in plain text and do NOT call the tool.",
    "Keep replies concise and practical, like an IDE coding assistant.",
  ].join("\n");
}

async function generateSceneLogicFromInstruction({
  instruction,
  objects,
  currentSceneLogic,
  requestId,
}) {
  const system = buildSystemPrompt({ objects, currentSceneLogic });
  const result = await chatJson({
    system,
    user: instruction,
    requestId,
  });

  let text = sanitizeJsonText(result.text);
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    const err = new Error("Model did not return valid JSON");
    err.status = 502;
    err.raw = text.slice(0, 4000);
    throw err;
  }

  repairExportedNodes(parsed, { baseline: currentSceneLogic, objects });
  const v = validateExportedNodes(parsed);
  if (!v.ok) {
    const err = new Error(v.error);
    err.status = 400;
    err.raw = parsed;
    throw err;
  }

  return { sceneLogic: parsed, model: result.model };
}

router.post("/assistant", requireAuth, async (req, res) => {
  const requestId = Date.now().toString(36) + "-" + Math.random().toString(16).slice(2, 8);
  try {
    const messages = req.body?.messages;
    const objects = req.body?.objects;
    const currentSceneLogic = req.body?.currentSceneLogic;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages array is required" });
    }

    const sanitized = messages
      .filter(
        (m) =>
          m &&
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string" &&
          m.content.trim().length > 0,
      )
      .slice(-20)
      .map((m) => ({ role: m.role, content: m.content.trim() }));

    if (sanitized.length === 0) {
      return res.status(400).json({ error: "messages must include at least one non-empty entry" });
    }

    const system = buildAssistantSystemPrompt({ objects, currentSceneLogic });
    const openaiMessages = [{ role: "system", content: system }, ...sanitized];

    let chatResult;
    try {
      chatResult = await chatCompletion({
        messages: openaiMessages,
        tools: [APPLY_SCENE_LOGIC_TOOL],
        requestId,
      });
    } catch (e) {
      const status = Number(e?.status) || 500;
      if (status === 500) {
        return res.status(500).json({ error: e.message || "Missing OPENAI_API_KEY on server" });
      }
      return res.status(status).json({
        error: e.message || "OpenAI request failed",
        status: e.httpStatus,
        details: e.details,
      });
    }

    const { message, model } = chatResult;
    const toolCalls = message.tool_calls ?? [];

    if (toolCalls.length > 0) {
      const logicCall = toolCalls.find((t) => t?.function?.name === "apply_scene_logic");
      if (!logicCall) {
        return res.status(502).json({ error: "Unexpected tool call from model" });
      }

      let instruction = "";
      try {
        const args = JSON.parse(logicCall.function.arguments || "{}");
        instruction = typeof args.instruction === "string" ? args.instruction : "";
      } catch {
        instruction = "";
      }
      if (!instruction.trim()) {
        instruction = sanitized[sanitized.length - 1]?.content ?? "";
      }

      try {
        const logicResult = await generateSceneLogicFromInstruction({
          instruction,
          objects,
          currentSceneLogic,
          requestId,
        });

        const summary =
          typeof message.content === "string" && message.content.trim()
            ? message.content.trim()
            : `Applied scene logic based on your request (${Object.keys(logicResult.sceneLogic).length} nodes).`;

        return res.json({
          type: "logic",
          message: summary,
          sceneLogic: logicResult.sceneLogic,
          model: logicResult.model || model,
        });
      } catch (e) {
        const status = Number(e?.status) || 502;
        return res.status(status).json({
          error: e.message || "Failed to generate scene logic",
          raw: e.raw,
        });
      }
    }

    const reply =
      typeof message.content === "string" && message.content.trim()
        ? message.content.trim()
        : "I could not generate a response. Please try again.";

    return res.json({ type: "chat", message: reply, model });
  } catch (e) {
    console.error(`[ai][${requestId}] Unexpected assistant error:`, e);
    return res.status(500).json({ error: e?.message || "Unknown server error" });
  }
});

router.post("/scene-logic", requireAuth, async (req, res) => {
  const requestId = Date.now().toString(36) + "-" + Math.random().toString(16).slice(2, 8);
  try {
    const prompt = typeof req.body?.prompt === "string" ? req.body.prompt : "";
    const objects = req.body?.objects;
    const currentSceneLogic = req.body?.currentSceneLogic;

    if (!prompt.trim()) {
      console.warn(`[ai][${requestId}] Empty prompt`);
      return res.status(400).json({ error: "prompt is required" });
    }

    console.log(`[ai][${requestId}] Prompt: ${prompt}`);
    console.log(
      `[ai][${requestId}] Objects: ${
        Array.isArray(objects)
          ? objects.map((o) => `${o.objectName}(${o.objectType})`).join(", ")
          : "none"
      }`,
    );

    let logicResult;
    try {
      logicResult = await generateSceneLogicFromInstruction({
        instruction: prompt,
        objects,
        currentSceneLogic,
        requestId,
      });
    } catch (e) {
      const status = Number(e?.status) || 502;
      return res.status(status).json({
        error: e.message || "Failed to generate scene logic",
        raw: e.raw,
      });
    }

    console.log(
      `[ai][${requestId}] Validation ok. Nodes: ${Object.keys(logicResult.sceneLogic).length}`,
    );

    return res.json({ sceneLogic: logicResult.sceneLogic, model: logicResult.model });
  } catch (e) {
    console.error(`[ai][${requestId}] Unexpected server error:`, e);
    return res.status(500).json({ error: e?.message || "Unknown server error" });
  }
});

module.exports = { aiRouter: router };
