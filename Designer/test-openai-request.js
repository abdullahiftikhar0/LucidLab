const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') });

function getEnv(name) {
  const value = process.env[name];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

async function main() {
  const apiKey = getEnv('OPENAI_API_KEY');
  const model = getEnv('OPENAI_MODEL') || 'gpt-5.4-mini';
  const prompt =
    process.argv.slice(2).join(' ').trim() ||
    'Return JSON: {"message":"hello from gpt-5.4-mini"}';

  if (!apiKey) {
    console.error('Missing OPENAI_API_KEY in backend/.env');
    process.exit(1);
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => '');
    console.error(`OpenAI request failed (${response.status})`);
    if (details) console.error(details);
    process.exit(1);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content ?? '';

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
