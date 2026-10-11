/* eslint-disable node/no-unpublished-require */

'use strict';

const {
  mockApp,
  clearMockApp,
  assertValidates,
  baseAppManifest,
  baseDriverManifest,
} = require('./fixtures/mock-app');

function withDropdownTrigger(valueOverrides) {
  return {
    ...baseAppManifest,
    drivers: [baseDriverManifest],
    flow: {
      triggers: [
        {
          id: 'test_trigger',
          title: { en: 'Test trigger' },
          titleFormatted: { en: 'Test trigger [[state]]' },
          args: [
            {
              name: 'state',
              type: 'dropdown',
              title: { en: 'State' },
              values: [
                { id: 'on', ...valueOverrides },
              ],
            },
          ],
        },
      ],
    },
  };
}

function withMultiselectTrigger(valueOverrides) {
  return {
    ...baseAppManifest,
    compatibility: '>=12.5.0',
    drivers: [baseDriverManifest],
    flow: {
      triggers: [
        {
          id: 'test_trigger',
          title: { en: 'Test trigger' },
          titleFormatted: { en: 'Test trigger [[state]]' },
          args: [
            {
              name: 'state',
              type: 'multiselect',
              title: { en: 'State' },
              conjunction: 'or',
              values: [
                { id: 'on', ...valueOverrides },
              ],
            },
          ],
        },
      ],
    },
  };
}

describe('HomeyLib.App#validate() flow card manifest', function() {
  this.slow(500);

  afterEach(function() {
    clearMockApp();
  });

  describe('dropdown argument values', function() {
    it('`values[].label` with an `en` translation should validate', async function() {
      const app = mockApp(withDropdownTrigger({ label: { en: 'On' } }));

      await assertValidates(app, {
        debug: true,
        publish: true,
        verified: true,
      });
    });

    it('`values[].title` with an `en` translation should validate', async function() {
      const app = mockApp(withDropdownTrigger({ title: { en: 'On' } }));

      await assertValidates(app, {
        debug: true,
        publish: true,
        verified: true,
      });
    });

    it('`values[].label` as a plain string should validate', async function() {
      const app = mockApp(withDropdownTrigger({ label: 'On' }));

      await assertValidates(app, {
        debug: true,
        publish: true,
        verified: true,
      });
    });

    it('`values[].title` as a plain string should validate', async function() {
      const app = mockApp(withDropdownTrigger({ title: 'On' }));

      await assertValidates(app, {
        debug: true,
        publish: true,
        verified: true,
      });
    });

    it('`values[]` using an unrecognized key (e.g. `name`) instead of `label`/`title` should fail', async function() {
      const app = mockApp(withDropdownTrigger({ name: { en: 'On' } }));

      await assertValidates(app, {
        debug: /values\[0\] should have required property 'title'/i,
        publish: /values\[0\] should have required property 'title'/i,
        verified: /values\[0\] should have required property 'title'/i,
      });
    });

    it('`values[].label` missing an `en` translation should fail', async function() {
      const app = mockApp(withDropdownTrigger({ label: { nl: 'Aan' } }));

      await assertValidates(app, {
        debug: /values\[0\]\.label should have required property 'en'/i,
        publish: /values\[0\]\.label should have required property 'en'/i,
        verified: /values\[0\]\.label should have required property 'en'/i,
      });
    });

    it('`values[].title` missing an `en` translation should fail', async function() {
      const app = mockApp(withDropdownTrigger({ title: { nl: 'Aan' } }));

      await assertValidates(app, {
        debug: /values\[0\]\.title should have required property 'en'/i,
        publish: /values\[0\]\.title should have required property 'en'/i,
        verified: /values\[0\]\.title should have required property 'en'/i,
      });
    });

    it('`values[]` with neither `label` nor `title` should fail', async function() {
      const app = mockApp(withDropdownTrigger({}));

      await assertValidates(app, {
        debug: /values\[0\] should have required property 'title'/i,
        publish: /values\[0\] should have required property 'title'/i,
        verified: /values\[0\] should have required property 'title'/i,
      });
    });
  });

  describe('multiselect argument values', function() {
    it('`values[].title` with an `en` translation should validate', async function() {
      const app = mockApp(withMultiselectTrigger({ title: { en: 'On' } }));

      await assertValidates(app, {
        debug: true,
        publish: true,
        verified: true,
      });
    });

    it('`values[].title` missing an `en` translation should fail', async function() {
      const app = mockApp(withMultiselectTrigger({ title: { nl: 'Aan' } }));

      await assertValidates(app, {
        debug: /values\[0\]\.title should have required property 'en'/i,
        publish: /values\[0\]\.title should have required property 'en'/i,
        verified: /values\[0\]\.title should have required property 'en'/i,
      });
    });

    it('`values[].label` (unsupported for multiselect, unlike dropdown) should fail', async function() {
      const app = mockApp(withMultiselectTrigger({ label: { en: 'On' } }));

      await assertValidates(app, {
        debug: /values\[0\] should have required property 'title'/i,
        publish: /values\[0\] should have required property 'title'/i,
        verified: /values\[0\] should have required property 'title'/i,
      });
    });

    it('`values[]` with neither `label` nor `title` should fail', async function() {
      const app = mockApp(withMultiselectTrigger({}));

      await assertValidates(app, {
        debug: /values\[0\] should have required property 'title'/i,
        publish: /values\[0\] should have required property 'title'/i,
        verified: /values\[0\] should have required property 'title'/i,
      });
    });
  });
});
