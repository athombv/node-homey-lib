'use strict';

const debug = require('debug')('homey-lib:AIReviewer');

const {
  extractArchive, extractDirectory, formatAppSource, summarizeExtracted,
} = require('./extract');
const { normalizeImages } = require('./images');
const { loadReferenceImages } = require('./references');
const { SUBMIT_REVIEW_TOOL } = require('./schema');
const { SYSTEM_PROMPT } = require('./prompt');
const { getReviewClient } = require('./clients');
const {
  KINDS, SEVERITIES, CATEGORIES,
} = require('./enums');

const estTokens = chars => Math.round(chars / 4);
const SUBMISSION_TYPES = ['new', 'update'];

/**
 * Runs an AI-powered review of a Homey App submission against the App Store
 * Guidelines + internal reviewer checklist.
 *
 * The reviewer is stateless. Persistence (if any) is the caller's job.
 *
 * @example
 *   const { AIReviewer } = require('homey-lib');
 *
 *   const reviewer = new AIReviewer({ modelString: 'openai/gpt-5.4' });
 *   const result = await reviewer.review({
 *     appPath: '/path/to/homey-app',
 *     manifest: require('./app.json'),
 *     submissionType: 'new',
 *   });
 *   console.log(result.verdict, result.findings);
 */
module.exports = class AIReviewer {

  constructor({ modelString } = {}) {
    if (!modelString) throw new Error('AIReviewer requires modelString (e.g. "openai/gpt-5.4")');
    this._modelString = modelString;
  }

  /**
   * Run a review.
   *
   * Exactly one of `archivePath` or `appPath` must be provided.
   *
   * @param {object} args
   * @param {string} [args.archivePath] - path to a .tar.gz of the app
   * @param {string} [args.appPath] - path to an already-extracted app directory
   * @param {object} args.manifest - the parsed app.json (its `id` is used as the app identifier in prompt/debug)
   * @param {number|string} [args.buildId] - build id (display only)
   * @param {string} [args.brandColor] - hex color (display only)
   * @param {'new'|'update'} [args.submissionType='new']
   * @param {Array<{label: string, source: string}>} [args.images] - image blocks; source = URL or local path
   * @param {string} [args.customInstructions] - app-specific reviewer instructions
   * @param {Array<object>} [args.similarApps] - already-resolved similar apps (JSON-serializable objects)
   *
   * @returns {Promise<{findings: Array, verdict: string, tokensUsed: object, model: string, providerSessionId: string|null}>}
   */
  async review({
    archivePath,
    appPath,
    manifest,
    buildId,
    brandColor,
    submissionType = 'new',
    images = [],
    customInstructions,
    similarApps = [],
  } = {}) {
    if (!archivePath && !appPath) {
      throw new Error('Provide either archivePath or appPath');
    }
    if (archivePath && appPath) {
      throw new Error('Provide either archivePath or appPath, not both');
    }
    if (!manifest || typeof manifest !== 'object') {
      throw new Error('manifest is required');
    }
    if (!SUBMISSION_TYPES.includes(submissionType)) {
      throw new Error(`submissionType must be one of ${SUBMISSION_TYPES.join(', ')} (got "${submissionType}")`);
    }

    const appId = manifest.id;
    debug(`review() appId=${appId} buildId=${buildId} model=${this._modelString} submissionType=${submissionType}`);

    const extracted = archivePath
      ? await extractArchive(archivePath)
      : await extractDirectory(appPath);
    debug(`extracted ${extracted.fileCount} files, ${(extracted.totalSize / 1024).toFixed(1)}KB`);

    const summary = summarizeExtracted(extracted);
    debug('source top files (chars / est tokens):');
    for (const f of summary.topFiles) {
      debug(`  ${f.chars.toString().padStart(7)} / ~${estTokens(f.chars).toString().padStart(5)}t  ${f.path}`);
    }

    const sourceText = formatAppSource(extracted);
    debug(`formatted source: ${sourceText.length} chars / ~${estTokens(sourceText.length)}t (sum of files: ${summary.totalChars})`);

    const referenceImages = loadReferenceImages();
    const normalizedImages = normalizeImages([...referenceImages, ...images]);
    if (referenceImages.length > 0) {
      debug(`attached ${referenceImages.length} reference image(s): ${referenceImages.map(r => r.label).join(', ')}`);
    }

    const userContent = this._buildUserContent({
      sourceText,
      buildId,
      manifest,
      brandColor,
      submissionType,
      customInstructions,
      similarApps,
      normalizedImages,
    });

    const client = getReviewClient({ modelString: this._modelString });
    const t0 = Date.now();
    const result = await client.review({
      systemPrompt: SYSTEM_PROMPT,
      userContent,
      toolSchema: SUBMIT_REVIEW_TOOL,
    });
    const secs = ((Date.now() - t0) / 1000).toFixed(1);
    const t = result.tokensUsed;
    debug(`review completed in ${secs}s model=${result.model} tokens in=${t.input} out=${t.output} cacheRead=${t.cacheRead} cacheCreate=${t.cacheCreate}`);

    if (!Array.isArray(result.findings)) {
      const rawType = typeof result.findings;
      const rawSample = String(result.findings || '').slice(0, 1000);
      throw new Error(`Agent returned malformed findings (expected array, got ${rawType}). Raw verdict=${result.verdict}. First 1000 chars of findings payload: ${rawSample}`);
    }

    const findings = this._normalizeFindings(result.findings);
    const verdict = this._deriveVerdict(findings, result.verdict);

    debug(`review complete findings=${findings.length} verdict=${verdict}`);

    return {
      findings,
      verdict,
      tokensUsed: result.tokensUsed,
      model: result.model,
      providerSessionId: result.providerSessionId,
    };
  }

  _deriveVerdict(findings, modelVerdict) {
    // Verdict is a pure function of severities. We derive it ourselves so it
    // can never drift from the findings (the model occasionally violates its
    // own verdict-derivation rule despite explicit prompt instructions).
    //
    // Rules (matching prompt):
    // - Any blocker (any kind) → reject
    // - kind=review warning without blocker → request_changes
    // - Otherwise → approve
    let derived;
    if (findings.some(f => f.severity === 'blocker')) {
      derived = 'reject';
    } else if (findings.some(f => f.kind === 'review' && f.severity === 'warning')) {
      derived = 'request_changes';
    } else {
      derived = 'approve';
    }

    if (modelVerdict && modelVerdict !== derived) {
      debug(`verdict mismatch: model said "${modelVerdict}", derived "${derived}" from findings — using derived`);
    }
    return derived;
  }

  _normalizeFindings(findings) {
    const coercions = [];
    const normalized = findings.map((raw, i) => {
      const f = { ...raw };
      if (!KINDS.includes(f.kind)) {
        coercions.push(`#${i} kind=${JSON.stringify(f.kind)} → review`);
        f.kind = 'review';
      }
      if (!SEVERITIES.includes(f.severity)) {
        coercions.push(`#${i} severity=${JSON.stringify(f.severity)} → suggestion`);
        f.severity = 'suggestion';
      }
      if (!CATEGORIES.includes(f.category)) {
        coercions.push(`#${i} category=${JSON.stringify(f.category)} → other`);
        f.category = 'other';
      }
      return f;
    });
    if (coercions.length > 0) {
      debug(`normalized ${coercions.length} finding(s) with out-of-enum values:`);
      for (const c of coercions) debug(`  ${c}`);
    }
    return normalized;
  }

  _buildUserContent({
    sourceText,
    buildId,
    manifest,
    brandColor,
    submissionType,
    customInstructions,
    similarApps,
    normalizedImages,
  }) {
    const isUpdate = submissionType === 'update';
    const header = [
      '## App Review Request',
      '',
      `**App ID:** ${manifest.id || '(unset)'}`,
      `**Build:** ${buildId != null ? `#${buildId}` : '(unset)'}`,
      `**Version:** ${manifest && manifest.version}`,
      `**Submission type:** ${isUpdate ? 'update (app is already live)' : 'new app'}`,
      `**Brand color:** ${brandColor || '(not set)'}`,
      '',
      'Review the app source below and call `submit_review` with the structured findings.',
      'App Image, Driver Image, App Icon, Driver Icon, and Widget Preview assets are attached as image blocks below.',
      '',
      '---',
      '',
    ].join('\n');

    const sections = [header];

    const trimmedInstructions = (customInstructions || '').trim();
    if (trimmedInstructions) {
      sections.push([
        '## App-specific reviewer instructions',
        '',
        // eslint-disable-next-line max-len
        'The human reviewer team has attached the following extra context for **this app specifically**. Treat this as additional guidance on top of the official guidelines and checklist. It does not override store rules unless it explicitly says so.',
        '',
        trimmedInstructions,
        '',
        '---',
        '',
      ].join('\n'));
    }

    sections.push(sourceText);

    if (similarApps.length > 0) {
      sections.push([
        '\n## Similar live apps in the store',
        '',
        'These existing apps were found by matching brand-name tokens. Check for unintended overlap or duplication of an existing app:',
        '',
        '```json',
        JSON.stringify(similarApps, null, 2),
        '```',
        '',
      ].join('\n'));
    }

    const content = [{ type: 'text', text: sections.join('\n') }];

    if (normalizedImages.length > 0) {
      content.push({ type: 'text', text: '\n## Images\n' });
      for (const img of normalizedImages) {
        const shortRef = img.url.startsWith('data:')
          ? `${img.url.slice(0, 32)}… (${(img.url.length / 1024).toFixed(1)}KB base64)`
          : img.url;
        content.push({ type: 'text', text: `\n**${img.label}** — ${shortRef}\n` });
        content.push({ type: 'image_url', url: img.url });
      }
    }

    const headerChars = header.length;
    const customInstructionsChars = trimmedInstructions.length;
    const similarChars = similarApps.length > 0 ? JSON.stringify(similarApps, null, 2).length : 0;
    const sourceChars = sourceText.length;
    const imageBlocks = content.filter(b => b.type === 'image_url').length;
    const totalTextChars = content
      .filter(b => b.type === 'text')
      .reduce((sum, b) => sum + b.text.length, 0);
    debug('userContent breakdown (chars / est tokens):');
    debug(`  header:        ${headerChars.toString().padStart(7)} / ~${estTokens(headerChars)}t`);
    debug(`  customInstr:   ${customInstructionsChars.toString().padStart(7)} / ~${estTokens(customInstructionsChars)}t ${trimmedInstructions ? '(present)' : '(none)'}`);
    debug(`  sourceText:    ${sourceChars.toString().padStart(7)} / ~${estTokens(sourceChars)}t`);
    debug(`  similarApps:   ${similarChars.toString().padStart(7)} / ~${estTokens(similarChars)}t (${similarApps.length} apps)`);
    debug(`  total text:    ${totalTextChars.toString().padStart(7)} / ~${estTokens(totalTextChars)}t`);
    debug(`  image blocks:  ${imageBlocks}`);

    return content;
  }

};
