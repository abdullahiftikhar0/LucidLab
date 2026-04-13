const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

function getEnv(name) {
  const value = process.env[name];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

async function main() {
  const apiKey = getEnv('GEMINI_API_KEY');
  const model = getEnv('GEMINI_MODEL') || 'gemini-2.5-flash';
  const prompt = process.argv.slice(2).join(' ').trim() || 'Say hello from Gemini in one short sentence.';

  if (!apiKey) {
    console.error('Missing GEMINI_API_KEY in Designer/.env');
    process.exit(1);
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.2,
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => '');
    console.error(`Gemini request failed (${response.status})`);
    if (details) console.error(details);
    process.exit(1);
  }

  const data = await response.json();

  const text =
    data?.candidates?.[0]?.content?.parts
      ?.map((p) => (typeof p?.text === 'string' ? p.text : ''))
      .filter(Boolean)
      .join('\n') || '';

  if (text) {
    console.log('Model:', model);
    console.log('Prompt:', prompt);
    console.log('Result:\n');
    console.log(text);
    return;
  }

  console.log('Model:', model);
  console.log('Prompt:', prompt);
  console.log('No text output found. Full response:');
  console.log(JSON.stringify(data, null, 2));
}

main().catch((err) => {
  console.error('Unexpected error:', err?.message || err);
  process.exit(1);
});
