'use strict';

module.exports = {
  extends: 'athom',
  rules: {
    // Disabled due to ESLint 7.x bugs that crash on template literals.
    // Re-enable after upgrading to ESLint 8+.
    'template-curly-spacing': 'off',
    indent: 'off',
  },
};
