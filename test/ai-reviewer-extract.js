/* eslint-disable node/no-unpublished-require */

'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { extractDirectory, formatAppSource } = require('../lib/AIReviewer/extract');
const AIReviewer = require('../lib/AIReviewer');

const ENV_SECRET = 'AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMIK7MDENGbPxRfiCYEXAMPLEKEY';
const SOURCE_SECRET = 'sk-proj-AbCdEf0123456789AbCdEf0123456789';

function writeApp(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'homey-review-test-'));
  for (const [rel, content] of Object.entries(files)) {
    const abs = path.join(dir, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content);
  }
  return dir;
}

describe('AIReviewer extract() secret filtering', function() {
  this.slow(500);

  const dirs = [];

  const app = extra => {
    const dir = writeApp({
      'app.json': JSON.stringify({ id: 'com.test.app', version: '1.0.0' }),
      'app.js': "'use strict';\nmodule.exports = {};\n",
      ...extra,
    });
    dirs.push(dir);
    return dir;
  };

  after(function() {
    for (const dir of dirs) {
      if (typeof fs.rmSync === 'function') {
        fs.rmSync(dir, { recursive: true, force: true });
      } else {
        fs.rmdirSync(dir, { recursive: true });
      }
    }
  });

  it('never sends a .env file, by name or content', async function() {
    const extracted = await extractDirectory(app({ '.env': ENV_SECRET }));
    const output = formatAppSource(extracted);

    assert.ok(!extracted.files.some(f => f.path === '.env'), '.env must not be collected');
    assert.ok(!output.includes('wJalrXUtnFEMIK7MDENGbPxRfiCYEXAMPLEKEY'), 'secret value must not reach the prompt');
  });

  it('excludes .env variants and other credential files', async function() {
    const extracted = await extractDirectory(app({
      '.env.local': ENV_SECRET,
      '.env.production': ENV_SECRET,
      '.npmrc': '//registry.npmjs.org/:_authToken=npm_0123456789abcdefghij',
      id_rsa: '-----BEGIN OPENSSH PRIVATE KEY-----\nb3BlbnNzaC1rZXktdjEAAAAA\n-----END OPENSSH PRIVATE KEY-----\n',
      'server.pem': '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQ\n-----END PRIVATE KEY-----\n',
    }));

    const collected = extracted.files.map(f => f.path);
    for (const secretFile of ['.env.local', '.env.production', '.npmrc', 'id_rsa', 'server.pem']) {
      assert.ok(!collected.includes(secretFile), `${secretFile} must not be collected`);
    }
  });

  it('reports excluded credential files by name so the reviewer can still flag them', async function() {
    const extracted = await extractDirectory(app({ '.env': ENV_SECRET }));

    assert.ok(Array.isArray(extracted.excluded), 'excluded must be reported');
    assert.ok(extracted.excluded.some(e => e.path === '.env' && e.reason === 'secret'), '.env must be reported as excluded');
    assert.ok(formatAppSource(extracted).includes('.env'), 'excluded filenames belong in the prompt');
  });

  it('honours .gitignore and .homeyignore', async function() {
    const extracted = await extractDirectory(app({
      '.gitignore': 'secrets.json\n',
      '.homeyignore': 'scratch/\n',
      'secrets.json': '{"token":"ignored-by-git"}',
      'scratch/notes.txt': 'ignored by homey',
      'keep.js': 'module.exports = 1;\n',
    }));

    const collected = extracted.files.map(f => f.path);
    assert.ok(!collected.includes('secrets.json'), 'gitignored file must not be collected');
    assert.ok(!collected.includes('scratch/notes.txt'), 'homeyignored file must not be collected');
    assert.ok(collected.includes('keep.js'), 'unignored source must still be collected');
  });

  it('lets `**/` in ignore rules match zero directories', async function() {
    const extracted = await extractDirectory(app({
      '.gitignore': '**/secrets.json\nconfig/**/secret.json\n',
      'secrets.json': '{}',
      'lib/secrets.json': '{}',
      'config/secret.json': '{}',
      'config/prod/secret.json': '{}',
    }));

    const collected = extracted.files.map(f => f.path);
    for (const ignored of ['secrets.json', 'lib/secrets.json', 'config/secret.json', 'config/prod/secret.json']) {
      assert.ok(!collected.includes(ignored), `${ignored} must not be collected`);
    }
  });

  it('redacts secret-shaped literals in source but keeps the finding visible', async function() {
    const extracted = await extractDirectory(app({
      'lib/Api.js': `'use strict';\n\nconst API_KEY = '${SOURCE_SECRET}';\n\nmodule.exports = API_KEY;\n`,
    }));
    const output = formatAppSource(extracted);

    assert.ok(!output.includes(SOURCE_SECRET), 'secret literal must not reach the prompt');
    assert.ok(output.includes('REDACTED'), 'a redaction marker must remain so the reviewer can still flag it');
    assert.ok(output.includes('const API_KEY ='), 'surrounding source must be preserved');
  });

  it('reports what will be sent before anything leaves the machine', async function() {
    const appPath = app({ '.env': ENV_SECRET });
    const reviewer = new AIReviewer({ modelString: 'openai/gpt-5.4' });
    let reported = null;

    process.env.HOMEY_AI_REVIEW_DRY_RUN = '1';
    try {
      await reviewer.review({
        appPath,
        manifest: { id: 'com.test.app', version: '1.0.0' },
        onExtracted: extraction => {
 reported = extraction;
},
      }).catch(() => {}); // the dry run aborts before the model call
    } finally {
      delete process.env.HOMEY_AI_REVIEW_DRY_RUN;
    }

    assert.ok(reported, 'onExtracted must be called');
    assert.ok(reported.files.includes('app.json'), 'the file list must be reported');
    assert.ok(!reported.files.includes('.env'), 'credential files must not appear as sent');
    assert.ok(reported.excluded.some(e => e.path === '.env'), 'credential files must be reported as excluded');
  });

  it('still collects ordinary app source', async function() {
    const extracted = await extractDirectory(app({
      'README.txt': 'A test app.\n',
      'drivers/lamp/device.js': "'use strict';\n",
    }));

    const collected = extracted.files.map(f => f.path);
    assert.ok(collected.includes('app.json'));
    assert.ok(collected.includes('README.txt'));
    assert.ok(collected.includes('drivers/lamp/device.js'));
  });
});
