'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 5500);
const HOST = process.env.HOST || '127.0.0.1';
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

function sendJson(response, status, payload) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  response.end(JSON.stringify(payload));
}

async function readJson(request) {
  let body = '';
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 32_000) throw new Error('Request is too large.');
  }
  return JSON.parse(body || '{}');
}

async function handleChat(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return sendJson(response, 405, { error: 'Use POST for chat requests.' });
  }

  if (!process.env.OPENAI_API_KEY) {
    return sendJson(response, 200, { demoMode: true });
  }

  let payload;
  try {
    payload = await readJson(request);
  } catch (error) {
    return sendJson(response, 400, { error: error.message || 'Invalid JSON request.' });
  }

  const messages = Array.isArray(payload.messages)
    ? payload.messages
      .filter(message => message && ['user', 'assistant'].includes(message.role) && typeof message.content === 'string')
      .slice(-12)
      .map(message => ({ role: message.role, content: message.content.slice(0, 1500) }))
    : [];

  if (!messages.length || messages.at(-1).role !== 'user') {
    return sendJson(response, 400, { error: 'Add a message before sending.' });
  }

  try {
    const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.4,
        max_tokens: 450,
        messages: [
          {
            role: 'system',
            content: 'You are Smart Health Assistant, a helpful, friendly customer-support AI for visitors and users of the Smart Health hospital-management website demo. Answer the user’s question directly, including general questions, and help with product navigation, demo workflows, and customer-service style questions. Be honest and concise. You only know the facts in this instruction and the conversation: do not invent hospital contact details, opening hours, prices, policies, account actions, or service availability; when a specific fact is missing, say so and suggest contacting the organization through its verified support channel. This is only a frontend demo, not a real hospital system: never claim access to patient records, never make diagnoses or treatment recommendations, and ask users not to share personal, medical, payment, or other sensitive information. Do not imply the application is HIPAA-compliant or suitable for clinical use. If asked for medical advice or an emergency response, state that you cannot provide clinical advice and direct them to a qualified clinician or local emergency services.',
          },
          ...messages,
        ],
      }),
      signal: AbortSignal.timeout(25_000),
    });
    const result = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      console.error(`AI provider returned ${upstream.status}: ${result.error?.message || 'unknown error'}`);
      return sendJson(response, 502, { error: 'The AI service could not answer. Please try again.' });
    }

    const reply = result.choices?.[0]?.message?.content?.trim();
    if (!reply) return sendJson(response, 502, { error: 'The AI service returned an empty answer.' });
    return sendJson(response, 200, { reply });
  } catch (error) {
    console.error('AI request failed:', error.message);
    return sendJson(response, 502, { error: 'Could not reach the AI service. Check your server connection and try again.' });
  }
}

function handleAssistantStatus(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return sendJson(response, 405, { error: 'Use GET to check assistant status.' });
  }
  return sendJson(response, 200, {
    aiEnabled: Boolean(process.env.OPENAI_API_KEY),
    model: process.env.OPENAI_API_KEY ? MODEL : null,
  });
}

function serveStatic(request, response) {
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, { Allow: 'GET, HEAD' });
    return response.end('Method not allowed');
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, `http://${request.headers.host}`).pathname);
  } catch (_) {
    response.writeHead(400);
    return response.end('Bad request');
  }
  if (pathname === '/') pathname = '/index.html';

  const filePath = path.resolve(ROOT, `.${pathname}`);
  const relativePath = path.relative(ROOT, filePath);
  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    response.writeHead(403);
    return response.end('Forbidden');
  }

  fs.stat(filePath, (statError, stat) => {
    if (statError || !stat.isFile()) {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return response.end('Not found');
    }
    response.writeHead(200, {
      'Content-Type': MIME_TYPES[path.extname(filePath)] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    });
    if (request.method === 'HEAD') return response.end();
    fs.createReadStream(filePath).pipe(response);
  });
}

const server = http.createServer((request, response) => {
  const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;
  if (pathname === '/api/chat') return void handleChat(request, response);
  if (pathname === '/api/status') return void handleAssistantStatus(request, response);
  serveStatic(request, response);
});

server.listen(PORT, HOST, () => {
  console.log(`Smart Health HMS running at http://${HOST}:${PORT}`);
  console.log(process.env.OPENAI_API_KEY ? `AI assistant enabled (${MODEL}).` : 'AI key not set; assistant will use local demo replies.');
});
