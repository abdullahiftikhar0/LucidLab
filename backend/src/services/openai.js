const { env } = require("../config/env");

const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";

async function chatJson({ system, user, model, requestId }) {
  if (!env.openaiApiKey) {
    const err = new Error("Missing OPENAI_API_KEY on server");
    err.status = 500;
    throw err;
  }

  const resolvedModel = model || env.openaiModel || "gpt-5.4-mini";
  const body = {
    model: resolvedModel,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.2,
    response_format: { type: "json_object" },
  };

  const response = await fetch(OPENAI_CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.openaiApiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    console.error(
      `[openai][${requestId}] Request failed (${response.status}): ${details}`,
    );
    const err = new Error("OpenAI request failed");
    err.status = 502;
    err.details = details;
    err.httpStatus = response.status;
    throw err;
  }

  const data = await response.json().catch((e) => {
    console.error(`[openai][${requestId}] Failed to parse JSON:`, e);
    const err = new Error("OpenAI returned non-JSON response");
    err.status = 502;
    throw err;
  });

  const text = data?.choices?.[0]?.message?.content ?? "";
  if (!text) {
    console.error(`[openai][${requestId}] Empty content`, data);
    const err = new Error("OpenAI returned empty response");
    err.status = 502;
    err.raw = data;
    throw err;
  }

  return { text, model: resolvedModel, raw: data };
}

module.exports = { chatJson };
