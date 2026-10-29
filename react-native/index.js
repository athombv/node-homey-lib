'use strict';

if (typeof global !== 'undefined') {
  const browserGlobal = global.window || {};
  const wp = require('../webpack');
  if (wp) {
    module.exports = wp;
  } else {
    module.exports = browserGlobal.HomeyLib;
  }
} else {
  module.exports = undefined;
}
