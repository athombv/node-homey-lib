'use strict';

const debug = require('debug')('homey-lib:AIReviewer');

let OpenAI;
try {
  // eslint-disable-next-line global-require, import/no-unresolved
  const mod = require('openai');
  OpenAI = mod && mod.default ? mod.default : mod;
} catch (err) {
  // peer dep not installed — throw at construction time with a helpful message.
}

function toOpenAIBlock(block) {
  if (block.type === 'text') {
    return { type: 'text', text: block.text };
  }
  if (block.type === 'image_url') {
    return { type: 'image_url', image_url: { url: block.url } };
  }
  throw new Error(`Unknown content block type: ${block.type}`);
}

// OpenAI has a long-standing backend routing bug where the capability gateway
// intermittently misclassifies a vision-capable model as text-only and rejects
// image_url content blocks with a 400. It fails in ~22ms (validation-layer)
// and typically succeeds on the next attempt. See community threads e.g.
// https://community.openai.com/t/image-url-is-only-supported-by-certain-models/966851
const KNOWN_TRANSIENT_400_RE = /image_url is only supported by certain models/i;
const MAX_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 500;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function formatOpenAIError(err) {
  const parts = [];
  if (err && err.status) parts.push(`HTTP ${err.status}`);
  if (err && err.code) parts.push(`code=${err.code}`);
  if (err && err.type) parts.push(`type=${err.type}`);
  if (err && err.param) parts.push(`param=${err.param}`);
  if (err && err.request_id) parts.push(`request_id=${err.request_id}`);
  const meta = parts.length > 0 ? ` (${parts.join(', ')})` : '';
  const body = err && err.error ? JSON.stringify(err.error, null, 2)
    : err && err.response && err.response.data ? JSON.stringify(err.response.data, null, 2)
      : null;
  return { meta, body };
}

/**
 * OpenAI Chat Completions implementation of the ReviewClient interface.
 *
 * Stateless single-shot completion with forced function-call so the model
 * can only respond by calling submit_review.
 */
module.exports = class OpenAIReviewClient {

  constructor({ model, apiKey = process.env.OPENAI_API_KEY } = {}) {
    if (!OpenAI) {
      throw new Error("Missing peer dependency 'openai'. Install it in your project: npm install openai");
    }
    if (!apiKey) throw new Error('OPENAI_API_KEY is not set');
    if (!model) throw new Error('OpenAIReviewClient requires a model');
    this._model = model;
    this._client = new OpenAI({ apiKey });
  }

  async review({ systemPrompt, userContent, toolSchema }) {
    const request = {
      model: this._model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent.map(toOpenAIBlock) },
      ],
      tools: [{
        type: 'function',
        function: {
          name: toolSchema.name,
          description: toolSchema.description,
          parameters: toolSchema.input_schema,
        },
      }],
      tool_choice: { type: 'function', function: { name: toolSchema.name } },
    };

    let response;
    let lastErr;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        response = await this._client.chat.completions.create(request);
        lastErr = null;
        break;
      } catch (err) {
        lastErr = err;
        const isKnownTransient = err && err.status === 400 && KNOWN_TRANSIENT_400_RE.test(err.message || '');
        if (!isKnownTransient || attempt === MAX_ATTEMPTS) break;
        const delay = RETRY_BASE_DELAY_MS * attempt;
        debug(`OpenAI transient 400 on attempt ${attempt}/${MAX_ATTEMPTS} — retrying in ${delay}ms`);
        await sleep(delay);
      }
    }

    if (lastErr) {
      const { meta, body } = formatOpenAIError(lastErr);
      debug(`OpenAI request failed${meta}: ${lastErr.message}`);
      if (body) debug(`OpenAI error body:\n${body}`);
      if (lastErr.headers) debug(`OpenAI response headers: ${JSON.stringify(lastErr.headers)}`);
      const wrapped = new Error(`OpenAI request failed${meta}: ${lastErr.message}${body ? `\n${body}` : ''}`);
      wrapped.cause = lastErr;
      throw wrapped;
    }

    const choice = response.choices && response.choices[0];
    const toolCalls = choice && choice.message && choice.message.tool_calls;
    const toolCall = toolCalls && toolCalls.find(t => t.function && t.function.name === toolSchema.name);
    if (!toolCall) {
      throw new Error(`OpenAI response did not contain a ${toolSchema.name} function-call`);
    }

    let input;
    try {
      input = JSON.parse(toolCall.function.arguments);
    } catch (err) {
      throw new Error(`OpenAI ${toolSchema.name} arguments were not valid JSON: ${err.message}`);
    }

    const u = response.usage || {};
    const cachedTokens = (u.prompt_tokens_details && u.prompt_tokens_details.cached_tokens) || 0;
    const rawPromptTokens = u.prompt_tokens || 0;

    return {
      findings: input.findings,
      verdict: input.verdict,
      tokensUsed: {
        input: Math.max(0, rawPromptTokens - cachedTokens),
        output: u.completion_tokens || 0,
        cacheRead: cachedTokens,
        cacheCreate: 0,
      },
      model: response.model || this._model,
      providerSessionId: response.id || null,
    };
  }

};
