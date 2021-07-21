'use strict';

const { App } = require('..');

console.log('Permissions:', App.getPermissions());
console.log('Categories:', App.getCategories());
console.log('Locales:', App.getLocales());
