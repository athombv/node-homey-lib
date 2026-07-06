'use strict';

const {
  SEVERITIES, VERDICTS, KINDS, CATEGORIES,
} = require('./enums');

// Provider-neutral tool definition. Each ReviewClient renders this into its
// provider-native shape (Anthropic Messages, OpenAI function-calling).
module.exports.SUBMIT_REVIEW_TOOL = {
  name: 'submit_review',
  description:
    'Submit the structured review. Call this exactly once when your review is complete. Do not output free-form prose; all review content must go through this tool call.',
  input_schema: {
    type: 'object',
    required: ['verdict', 'findings'],
    properties: {
      verdict: {
        type: 'string',
        enum: VERDICTS,
        description: 'Overall recommendation. Derive deterministically: any blocker → reject; warnings without blockers → request_changes; only suggestions or none → approve.',
      },
      findings: {
        type: 'array',
        items: {
          type: 'object',
          required: ['kind', 'severity', 'category', 'title', 'explanation'],
          properties: {
            kind: {
              type: 'string',
              enum: KINDS,
              description: '"review" = guideline/checklist/security/SDK violation (drives the verdict and is shown to the developer). "code" = code-quality observation (advisory, never affects the verdict, shown to the reviewer separately).',
            },
            severity: { type: 'string', enum: SEVERITIES },
            category: { type: 'string', enum: CATEGORIES },
            title: { type: 'string', description: 'Short, imperative summary of the issue.' },
            explanation: { type: 'string', description: 'Why this is a problem and what the developer should do.' },
            guidelineRef: { type: 'string', description: 'For kind=review: cite the guideline section (e.g. "1.1", "checklist:duplicate"). For kind=code: omit or describe the rule (e.g. "no-console-log").' },
            evidence: { type: 'string', description: 'File path, line number, or asset reference where you observed the issue.' },
          },
        },
      },
    },
  },
};
