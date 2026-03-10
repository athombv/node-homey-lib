/* eslint-disable global-require */

'use strict';

try {
  const fs = require('fs');
  const path = require('path');
  const util = require('util');
  const imageSize = require('image-size');

  if (fs && util && util.promisify) {
    /** @type {typeof fs.open.__promisify__} */
    module.exports.openAsync = util.promisify(fs.open);
    /** @type {typeof fs.close.__promisify__} */
    module.exports.closeAsync = util.promisify(fs.close);
    /** @type {typeof fs.read.__promisify__} */
    module.exports.readAsync = util.promisify(fs.read);
    /** @type {typeof fs.stat.__promisify__} */
    module.exports.statAsync = util.promisify(fs.stat);
    /** @type {typeof fs.readFile.__promisify__} */
    module.exports.readFileAsync = util.promisify(fs.readFile);
    /** @type {typeof fs.readdir.__promisify__} */
    module.exports.readDirAsync = util.promisify(fs.readdir);
    /** @type {typeof fs.lstat.__promisify__} */
    module.exports.lstatAsync = util.promisify(fs.lstat);
    module.exports.imageSizeAsync = util.promisify(imageSize);
  }

  if (path) {
    /** @type {typeof path.join} */
    module.exports.join = path.join;
    /** @type {typeof path.extname} */
    module.exports.extname = path.extname;
    /** @type {typeof path.basename} */
    module.exports.basename = path.basename;
    /** @type {typeof path.dirname} */
    module.exports.dirname = path.dirname;
  }
} catch (err) {
}
