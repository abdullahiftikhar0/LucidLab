const express = require("express");
const { env } = require("../config/env");
const { requireAuth } = require("../middleware/auth");

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

// Fix common small mismatches in Gemini's output so it better matches our node graph.
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
    const truncated = asString.length > 4000 ? asString.slice(0, 4000) + "\n... (truncated) ..." : asString;
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
    "- SetColor must always include a valid target object (controls.object) and controls.color.",
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

router.post("/scene-logic", requireAuth, async (req, res) => {
  const requestId = Date.now().toString(36) + "-" + Math.random().toString(16).slice(2, 8);
  try {
    if (!env.geminiApiKey) {
      console.error(`[ai][${requestId}] Missing GEMINI_API_KEY on server`);
      return res.status(500).json({ error: "Missing GEMINI_API_KEY on server" });
    }

    const model = env.geminiModel || "gemini-2.5-flash";
    const prompt = typeof req.body?.prompt === "string" ? req.body.prompt : "";
    const objects = req.body?.objects;
    const currentSceneLogic = req.body?.currentSceneLogic;

    if (!prompt.trim()) {
      console.warn(`[ai][${requestId}] Empty prompt`);
      return res.status(400).json({ error: "prompt is required" });
    }

    console.log(`[ai][${requestId}] Model: ${model}`);
    console.log(`[ai][${requestId}] Prompt: ${prompt}`);
    console.log(
      `[ai][${requestId}] Objects: ${
        Array.isArray(objects)
          ? objects.map((o) => `${o.objectName}(${o.objectType})`).join(", ")
          : "none"
      }`,
    );

    const system = buildSystemPrompt({ objects, currentSceneLogic });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model,
    )}:generateContent?key=${encodeURIComponent(env.geminiApiKey)}`;
    const body = {
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    };

    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!r.ok) {
      const text = await r.text().catch(() => "");
      console.error(`[ai][${requestId}] Gemini request failed (${r.status}): ${text}`);
      return res
        .status(502)
        .json({ error: "Gemini request failed", status: r.status, details: text });
    }

    const data = await r.json().catch((e) => {
      console.error(`[ai][${requestId}] Failed to parse Gemini JSON:`, e);
      return null;
    });
    if (!data) {
      return res.status(502).json({ error: "Gemini returned non-JSON response" });
    }

    let text =
      data?.candidates?.[0]?.content?.parts?.map((p) => p?.text).filter(Boolean).join("\n") || "";
    if (!text) {
      console.error(`[ai][${requestId}] Gemini returned empty content`, data);
      return res.status(502).json({ error: "Gemini returned empty response", raw: data });
    }

    console.log(
      `[ai][${requestId}] Raw Gemini text (first 400 chars):\n${text.slice(0, 400)}`,
    );
    console.log(`[ai][${requestId}] Raw Gemini text length: ${text.length}`);
    console.log(`[ai][${requestId}] Raw Gemini text (full) START\n${text}\n[ai][${requestId}] Raw Gemini text (full) END`);

    // Apply small, known-safe sanitizations before parsing.
    text = sanitizeJsonText(text);

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      console.error(
        `[ai][${requestId}] Failed to JSON.parse Gemini output:`,
        e,
        "\nRaw text (first 4000 chars):\n",
        text.slice(0, 4000),
      );
      return res
        .status(502)
        .json({ error: "Gemini did not return valid JSON", raw: text.slice(0, 4000) });
    }

    // Normalize common issues (e.g. execOutputs key "0" instead of "exec").
    normalizeExportedNodes(parsed);

    const v = validateExportedNodes(parsed);
    if (!v.ok) {
      console.error(`[ai][${requestId}] Validation failed: ${v.error}`, parsed);
      return res.status(400).json({ error: v.error, raw: parsed });
    }

    console.log(`[ai][${requestId}] Validation ok. Nodes: ${Object.keys(parsed).length}`);

    return res.json({ sceneLogic: parsed, model });
  } catch (e) {
    console.error(`[ai][${requestId}] Unexpected server error:`, e);
    return res.status(500).json({ error: e?.message || "Unknown server error" });
  }
});

module.exports = { aiRouter: router };
