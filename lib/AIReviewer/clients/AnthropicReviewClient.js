'use strict';

let Anthropic;
try {
  // eslint-disable-next-line global-require, import/no-unresolved
  const mod = require('@anthropic-ai/sdk');
  Anthropic = mod && mod.default ? mod.default : mod;
} catch (err) {
  // peer dep not installed — throw at construction time with a helpful message.
}

const MAX_TOKENS = 16000;

// data:<mime>;base64,<payload>
const DATA_URL_RE = /^data:([^;,]+);base64,(.+)$/;

function toAnthropicBlock(block) {
  if (block.type === 'text') {
    return { type: 'text', text: block.text };
  }
  if (block.type === 'image_url') {
    // Anthropic distinguishes at the API level: `type: 'url'` requires an
    // HTTPS URL, and inline bytes must be sent as `type: 'base64'`.
    const match = DATA_URL_RE.exec(block.url);
    if (match) {
      return {
        type: 'image',
        source: { type: 'base64', media_type: match[1], data: match[2] },
      };
    }
    return { type: 'image', source: { type: 'url', url: block.url } };
  }
  throw new Error(`Unknown content block type: ${block.type}`);
}

/**
 * Anthropic Messages API implementation of the ReviewClient interface.
 *
 * Stateless single-shot completion. No managed-agent state on Anthropic side.
 * Tool-choice is forced so the model can only respond by calling submit_review.
 */
module.exports = class AnthropicReviewClient {

  constructor({ model, apiKey = process.env.ANTHROPIC_API_KEY } = {}) {
    if (!Anthropic) {
      throw new Error("Missing peer dependency '@anthropic-ai/sdk'. Install it in your project: npm install @anthropic-ai/sdk");
    }
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set');
    if (!model) throw new Error('AnthropicReviewClient requires a model');
    this._model = model;
    this._client = new Anthropic({ apiKey });
  }

  async review({ systemPrompt, userContent, toolSchema }) {
    const response = await this._client.messages.create({
      model: this._model,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      tools: [{
        name: toolSchema.name,
        description: toolSchema.description,
        input_schema: toolSchema.input_schema,
      }],
      tool_choice: { type: 'tool', name: toolSchema.name },
      messages: [{
        role: 'user',
        content: userContent.map(toAnthropicBlock),
      }],
    });

    const toolUse = response.content.find(b => b.type === 'tool_use' && b.name === toolSchema.name);
    if (!toolUse) {
      throw new Error(`Anthropic response did not contain a ${toolSchema.name} tool_use block`);
    }

    const { input } = toolUse;
    const u = response.usage || {};

    return {
      findings: input.findings,
      verdict: input.verdict,
      tokensUsed: {
        input: u.input_tokens || 0,
        output: u.output_tokens || 0,
        cacheRead: u.cache_read_input_tokens || 0,
        cacheCreate: u.cache_creation_input_tokens || 0,
      },
      model: response.model || this._model,
      providerSessionId: response.id || null,
    };
  }

};
