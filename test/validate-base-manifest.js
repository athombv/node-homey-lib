/* eslint-disable node/no-unpublished-require */

'use strict';

const {
  baseAppManifest,
  mockApp,
  clearMockApp,
  assertValidates,
} = require('./fixtures/mock-app');

describe('HomeyLib.App#validate() base manifest', function() {
  this.slow(500);

  afterEach(function() {
    clearMockApp();
  });

  /*
   * App ID
   */

  it('`id` needs to be defined', async function() {
    const app = mockApp({
      ...baseAppManifest,
      id: undefined,
    });

    await assertValidates(app, {
      debug: /should have required property 'id'/i,
      publish: /should have required property 'id'/i,
      verified: /should have required property 'id'/i,
    });
  });

  it('`id` needs to be a reverse DNS', async function() {
    const app = mockApp({
      ...baseAppManifest,
      id: 'test',
    });

    await assertValidates(app, {
      debug: /invalid id/i,
      publish: /invalid id/i,
      verified: /invalid id/i,
    });
  });

  /*
   * App Name
   */

  it('`name` needs to be defined', async function() {
    const app = mockApp({
      ...baseAppManifest,
      name: undefined,
    });

    await assertValidates(app, {
      debug: /should have required property 'name'/i,
      publish: /should have required property 'name'/i,
      verified: /should have required property 'name'/i,
    });
  });

  /*
   * App Brand Color
   */

  it('`brandColor` needs to be defined', async function() {
    const app = mockApp({
      ...baseAppManifest,
      brandColor: undefined,
    });

    await assertValidates(app, {
      debug: true, // brandColor is optional for debug
      publish: /property `brandColor` is required/i,
      verified: /property `brandColor` is required/i,
    });
  });

  it('`brandColor` needs to be a hex color', async function() {
    const app = mockApp({
      ...baseAppManifest,
      brandColor: 'fuchsia',
    });

    await assertValidates(app, {
      debug: /brandColor should match pattern/i,
      publish: /brandColor should match pattern/i,
      verified: /brandColor should match pattern/i,
    });
  });

  it('`brandColor` is not allowed to be too bright', async function() {
    const app = mockApp({
      ...baseAppManifest,
      brandColor: '#FFFFFF',
    });

    await assertValidates(app, {
      debug: /`brandColor` is too bright/i,
      publish: /`brandColor` is too bright/i,
      verified: /`brandColor` is too bright/i,
    });
  });

  /*
   * App Version
   */

  it('`version` needs to be defined', async function() {
    const app = mockApp({
      ...baseAppManifest,
      version: undefined,
    });

    await assertValidates(app, {
      debug: /should have required property 'version'/i,
      publish: /should have required property 'version'/i,
      verified: /should have required property 'version'/i,
    });
  });

  it('`version` needs to be a valid semver string', async function() {
    const app = mockApp({
      ...baseAppManifest,
      version: '1',
    });

    await assertValidates(app, {
      debug: /invalid version/i,
      publish: /invalid version/i,
      verified: /invalid version/i,
    });
  });

  /*
   * App SDK version
   */

  it('`sdk` can be undefined', async function() {
    const app = mockApp({
      ...baseAppManifest,
      sdk: undefined,
    });

    await assertValidates(app, {
      debug: true,
      publish: true,
      verified: true,
    });
  });

  it('`sdk` needs to be valid', async function() {
    const app = mockApp({
      ...baseAppManifest,
      sdk: 0,
    });

    await assertValidates(app, {
      debug: /sdk should be >= 1/i,
      publish: /sdk should be >= 1/i,
      verified: /sdk should be >= 1/i,
    });
  });

  it('`sdk: 3` needs at least `compatibility: ">=5.0.0"`', async function() {
    const app = mockApp({
      ...baseAppManifest,
      sdk: 3,
      compatibility: '>=4.2.0',
    });

    await assertValidates(app, {
      debug: /sdk version 3 apps must have a compatibility of at least >=5.0.0/i,
      publish: /sdk version 3 apps must have a compatibility of at least >=5.0.0/i,
      verified: /sdk version 3 apps must have a compatibility of at least >=5.0.0/i,
    });
  });

  /*
   * App Compatibility
   */

  it('`compatibility` needs to be defined', async function() {
    const app = mockApp({
      ...baseAppManifest,
      compatibility: undefined,
    });

    await assertValidates(app, {
      debug: /should have required property 'compatibility'/i,
      publish: /should have required property 'compatibility'/i,
      verified: /should have required property 'compatibility'/i,
    });
  });

  it('`compatibility` needs to be a valid semver string', async function() {
    const app = mockApp({
      ...baseAppManifest,
      compatibility: '1',
    });

    await assertValidates(app, {
      debug: /invalid compatibility/i,
      publish: /invalid compatibility/i,
      verified: /invalid compatibility/i,
    });
  });

  /*
   * App Platforms
   */

  it('`platforms` needs to be defined', async function() {
    const app = mockApp({
      ...baseAppManifest,
      platforms: undefined,
    });

    await assertValidates(app, {
      debug: true, // platforms is optional for debug
      publish: true, // platforms is optional for publish
      verified: /property `platforms` is required/i,
    });
  });

  it('`platforms` needs to be valid', async function() {
    const app = mockApp({
      ...baseAppManifest,
      platforms: ['none'],
    });

    await assertValidates(app, {
      debug: /platforms\[0\] should be equal to one of the allowed values/i,
      publish: /platforms\[0\] should be equal to one of the allowed values/i,
      verified: /platforms\[0\] should be equal to one of the allowed values/i,
    });
  });

  /*
   * App Category
   */

  it('`category` needs to be defined', async function() {
    const app = mockApp({
      ...baseAppManifest,
      category: undefined,
    });

    await assertValidates(app, {
      debug: true, // category is optional for debug
      publish: /property `category` is required/i,
      verified: /property `category` is required/i,
    });
  });

  it('`category` needs to be valid', async function() {
    const app = mockApp({
      ...baseAppManifest,
      category: ['none'],
    });

    await assertValidates(app, {
      debug: /invalid category/i,
      publish: /invalid category/i,
      verified: /invalid category/i,
    });
  });

  /*
   * App Tags
   */

  it('`tags` can be validated', async function() {
    const app = mockApp({
      ...baseAppManifest,
      tags: { en: ['test'] },
    });

    await assertValidates(app, {
      debug: true,
      publish: true,
      verified: true,
    });
  });

  it('`tags` needs to be valid', async function() {
    const app = mockApp({
      ...baseAppManifest,
      tags: 'test',
    });

    await assertValidates(app, {
      debug: /tags should be object/i,
      publish: /tags should be object/i,
      verified: /tags should be object/i,
    });
  });

  /*
   * App Images
   */

  it('`images` needs to be defined', async function() {
    const app = mockApp({
      ...baseAppManifest,
      images: undefined,
    });

    await assertValidates(app, {
      debug: true, // debug does not validate images
      publish: /property `images` is required/i,
      verified: /property `images` is required/i,
    });
  });

  it('`images` need to be a known format', async function() {
    const app = mockApp({
      ...baseAppManifest,
      images: {
        small: '/assets/images/small.webp',
        large: '/assets/images/large.webp',
        xlarge: '/assets/images/xlarge.webp',
      },
    });

    await assertValidates(app, {
      debug: true, // debug does not validate images
      publish: /invalid image extension/i,
      verified: /invalid image extension/i,
    });
  });

  /*
   * App Author
   */

  it('`author` needs to be defined', async function() {
    const app = mockApp({
      ...baseAppManifest,
      author: undefined,
    });

    await assertValidates(app, {
      debug: /should have required property 'author'/i,
      publish: /should have required property 'author'/i,
      verified: /should have required property 'author'/i,
    });
  });

  it('`author.name` should be defined', async function() {
    const app = mockApp({
      ...baseAppManifest,
      author: {
        name: undefined,
      },
    });

    await assertValidates(app, {
      debug: /author should have required property 'name'/i,
      publish: /author should have required property 'name'/i,
      verified: /author should have required property 'name'/i,
    });
  });

  it('`author.email` should be valid', async function() {
    const app = mockApp({
      ...baseAppManifest,
      author: {
        name: 'Athom B.V.',
        email: 10,
      },
    });

    await assertValidates(app, {
      debug: /author\.email should be string/i,
      publish: /author\.email should be string/i,
      verified: /author\.email should be string/i,
    });
  });

  it('`author.website` should be valid', async function() {
    const app = mockApp({
      ...baseAppManifest,
      author: {
        name: 'Athom B.V.',
        website: 10,
      },
    });

    await assertValidates(app, {
      debug: /author\.website should be string/i,
      publish: /author\.website should be string/i,
      verified: /author\.website should be string/i,
    });
  });

  /*
   * App Support
   */

  it('`support` needs to be defined', async function() {
    const app = mockApp({
      ...baseAppManifest,
      support: undefined,
    });

    await assertValidates(app, {
      debug: true, // support is optional for debug
      publish: true, // support is optional for publish
      verified: /property `support` is required/i,
    });
  });

  it('`support` needs to be a valid link', async function() {
    const app = mockApp({
      ...baseAppManifest,
      support: 'test',
    });

    await assertValidates(app, {
      debug: /support should match pattern/i,
      publish: /support should match pattern/i,
      verified: /support should match pattern/i,
    });
  });

  /*
   * App Permissions
   */

  it('`permissions` can be validated', async function() {
    const app = mockApp({
      ...baseAppManifest,
      permissions: ['homey:wireless:ble', 'homey:app:com.athom.example'],
    });

    await assertValidates(app, {
      debug: true,
      publish: true,
      verified: true,
    });
  });

  it('`permissions` needs to be valid', async function() {
    const app = mockApp({
      ...baseAppManifest,
      permissions: ['none'],
    });

    await assertValidates(app, {
      debug: /invalid permission/i,
      publish: /invalid permission/i,
      verified: /invalid permission/i,
    });
  });

  /*
   * App Source
   */

  it('`source` can be validated', async function() {
    const app = mockApp({
      ...baseAppManifest,
      source: 'https://github.com/athombv/com.athom.myapp',
    });

    await assertValidates(app, {
      debug: true,
      publish: true,
      verified: true,
    });
  });

  it('`source` needs to be valid', async function() {
    const app = mockApp({
      ...baseAppManifest,
      source: 'test',
    });

    await assertValidates(app, {
      debug: /source should match pattern/i,
      publish: /source should match pattern/i,
      verified: /source should match pattern/i,
    });
  });

  /*
   * App Home Page
   */

  it('`homepage` can be validated', async function() {
    const app = mockApp({
      ...baseAppManifest,
      homepage: 'https://homey.app/',
    });

    await assertValidates(app, {
      debug: true,
      publish: true,
      verified: true,
    });
  });

  it('`homepage` needs to be valid', async function() {
    const app = mockApp({
      ...baseAppManifest,
      homepage: 'test',
    });

    await assertValidates(app, {
      debug: /homepage should match pattern/i,
      publish: /homepage should match pattern/i,
      verified: /homepage should match pattern/i,
    });
  });

  /*
   * App Bugs
   */

  it('`bugs` can be validated', async function() {
    const app = mockApp({
      ...baseAppManifest,
      bugs: {
        url: 'https://github.com/athombv/homey-apps-sdk-issues/issues',
      },
    });

    await assertValidates(app, {
      debug: true,
      publish: true,
      verified: true,
    });
  });

  it('`bugs` needs to be valid', async function() {
    const app = mockApp({
      ...baseAppManifest,
      bugs: 'test',
    });

    await assertValidates(app, {
      debug: /bugs should be object/i,
      publish: /bugs should be object/i,
      verified: /bugs should be object/i,
    });
  });

  /*
   * App Athom Forum Discussion ID
   */

  it('`athomForumDiscussionId` can be validated', async function() {
    const app = mockApp({
      ...baseAppManifest,
      athomForumDiscussionId: 1234,
    });

    await assertValidates(app, {
      debug: true,
      publish: true,
      verified: true,
    });
  });

  it('`athomForumDiscussionId` needs to be valid', async function() {
    const app = mockApp({
      ...baseAppManifest,
      athomForumDiscussionId: 'test',
    });

    await assertValidates(app, {
      debug: /athomForumDiscussionId should be number/i,
      publish: /athomForumDiscussionId should be number/i,
      verified: /athomForumDiscussionId should be number/i,
    });
  });

  /*
   * App Homey Community Topic ID
   */

  it('`homeyCommunityTopicId` can be validated', async function() {
    const app = mockApp({
      ...baseAppManifest,
      homeyCommunityTopicId: 1234,
    });

    await assertValidates(app, {
      debug: true,
      publish: true,
      verified: true,
    });
  });

  it('`homeyCommunityTopicId` needs to be valid', async function() {
    const app = mockApp({
      ...baseAppManifest,
      homeyCommunityTopicId: 'test',
    });

    await assertValidates(app, {
      debug: /homeyCommunityTopicId should be number/i,
      publish: /homeyCommunityTopicId should be number/i,
      verified: /homeyCommunityTopicId should be number/i,
    });
  });

  /*
   * App Homey Community Topic ID
   */

  it('`contributers` can be validated', async function() {
    const app = mockApp({
      ...baseAppManifest,
      contributors: {
        developers: [{
          name: 'Athom B.V.',
          email: 'info@athom.com',
          website: 'https://athom.nl',
        }],
        translators: [{
          name: 'Athom B.V.',
          email: 'info@athom.com',
          website: 'https://athom.nl',
        }],
      },
    });

    await assertValidates(app, {
      debug: true,
      publish: true,
      verified: true,
    });
  });

  it('`contributers` cannot contain additional properties', async function() {
    const app = mockApp({
      ...baseAppManifest,
      contributors: {
        test: {},
      },
    });

    await assertValidates(app, {
      debug: /contributors should not have additional properties/i,
      publish: /contributors should not have additional properties/i,
      verified: /contributors should not have additional properties/i,
    });
  });

  it('`contributers.developers` needs to be valid', async function() {
    const app = mockApp({
      ...baseAppManifest,
      contributors: {
        developers: {},
      },
    });

    await assertValidates(app, {
      debug: /contributors\['developers'\] should be array/i,
      publish: /contributors\['developers'\] should be array/i,
      verified: /contributors\['developers'\] should be array/i,
    });
  });

  it('`contributers.translators` needs to be valid', async function() {
    const app = mockApp({
      ...baseAppManifest,
      contributors: {
        translators: {},
      },
    });

    await assertValidates(app, {
      debug: /contributors\['translators'\] should be array/i,
      publish: /contributors\['translators'\] should be array/i,
      verified: /contributors\['translators'\] should be array/i,
    });
  });
});
