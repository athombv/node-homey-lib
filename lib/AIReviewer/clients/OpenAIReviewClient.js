'use strict';

let OpenAI;
try {
  // eslint-disable-next-line global-require, import/no-unresolved
  OpenAI = require('openai');
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
    const response = await this._client.chat.completions.create({
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
    });

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
