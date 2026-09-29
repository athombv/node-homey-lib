'use strict';

// Files whose contents may be credentials. Matched on the filename alone,
// before any extension logic runs, so a `.env` can never be picked up as
// "plain text source". The contents are never read; only the filename is
// reported, so a reviewer can still see that the app ships one.
const SECRET_FILE_PATTERNS = [
  /^\.env(\..+)?$/i,
  /^env\.json$/i, // the Homey convention for app secrets
  /^\.npmrc$/i,
  /^\.netrc$/i,
  /^\.pgpass$/i,
  /^\.htpasswd$/i,
  /^credentials$/i,
  /^id_(rsa|dsa|ecdsa|ed25519)$/i,
  /\.(pem|key|p12|pfx|jks|keystore|ppk)$/i,
];

const SECRET_DIRS = new Set(['.ssh', '.aws', '.gnupg']);

// Secret-shaped values inside files we do send. The match is replaced by a
// marker rather than dropped: the reviewer is asked to flag hardcoded secrets,
// and it can still do that against `[REDACTED:…]` without the value leaving
// the machine. `group` names the capture to replace when the pattern needs
// surrounding context to match.
const REDACTION_PATTERNS = [
  { kind: 'private-key', re: /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g },
  { kind: 'openai-key', re: /\bsk-[A-Za-z0-9_-]{20,}/g },
  { kind: 'github-token', re: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}\b|\bgithub_pat_[A-Za-z0-9_]{22,}\b/g },
  { kind: 'aws-access-key', re: /\bAKIA[0-9A-Z]{16}\b/g },
  { kind: 'google-api-key', re: /\bAIza[0-9A-Za-z_-]{35}\b/g },
  { kind: 'slack-token', re: /\bxox[abprs]-[A-Za-z0-9-]{10,}/g },
  {
    kind: 'credential-literal',
    re: /((?:api[_-]?key|secret|secret[_-]?access[_-]?key|token|password|passwd|pwd|client[_-]?secret)["']?\s*[:=]\s*)(["'])([^"'\n]{12,})\2/gi,
    group: 3,
  },
];

function isSecretFile(filename) {
  return SECRET_FILE_PATTERNS.some(re => re.test(filename));
}

function isSecretDir(dirname) {
  return SECRET_DIRS.has(dirname);
}

/**
 * @param {string} content
 * @returns {{content: string, kinds: string[]}} redacted content + the kinds that matched
 */
function redactSecrets(content) {
  const kinds = [];
  let out = content;

  for (const { kind, re, group } of REDACTION_PATTERNS) {
    out = out.replace(re, (match, ...args) => {
      const value = group ? args[group - 1] : match;
      if (value.includes('[REDACTED:')) return match; // already handled by an earlier pattern
      kinds.push(kind);
      if (!group) return `[REDACTED:${kind}]`;
      return match.replace(value, `[REDACTED:${kind}]`);
    });
  }

  return { content: out, kinds };
}

module.exports = { isSecretFile, isSecretDir, redactSecrets };
