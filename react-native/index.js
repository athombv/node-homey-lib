'use strict';

if( typeof global !== 'undefined' ) {
  global.window = global.window || {};
  require('../webpack');
  module.exports = global.window.HomeyLib;
} else {
  module.exports = undefined;
}