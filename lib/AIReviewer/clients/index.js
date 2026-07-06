'use strict';

const AnthropicReviewClient = require('./AnthropicReviewClient');
const OpenAIReviewClient = require('./OpenAIReviewClient');

/**
 * Returns a ReviewClient instance based on `modelString`.
 *
 * Format: "<provider>/<model>", e.g. "anthropic/claude-sonnet-4-6" or
 * "openai/gpt-5.4".
 *
 * @param {object} args
 * @param {string} args.modelString
 * @param {string} [args.apiKey] - overrides env var; passed through to the client
 */
module.exports.getReviewClient = function getReviewClient({ modelString, apiKey } = {}) {
  if (!modelString) throw new Error('modelString is required');

  const slash = modelString.indexOf('/');
  if (slash < 0) {
    throw new Error(`Invalid modelString "${modelString}" — expected "<provider>/<model>"`);
  }

  const provider = modelString.slice(0, slash);
  const model = modelString.slice(slash + 1);

  if (provider === 'anthropic') return new AnthropicReviewClient({ model, apiKey });
  if (provider === 'openai') return new OpenAIReviewClient({ model, apiKey });

  throw new Error(`Unknown provider "${provider}" in modelString "${modelString}". Supported: openai, anthropic.`);
};
