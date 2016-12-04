let _ = require('highland');
let path = require('path');

global.expect = require('expect');
global._ = _;
global.debug = require('debug');

require('./highland-custom-ops');

global.clearRequireCache = () => {
  _(Object.keys(require.cache))
    .reject((filepath) => filepath.includes('node_modules'))
    .reject((filepath) => filepath.includes(path.resolve(__dirname, '..')))
    .each((filepath) => {
      delete require.cache[filepath];
    })
    .done(() => {
      console.log('Cleared require.cache\n\n');
    });
};

global.restoreSpies = () => {
  expect.restoreSpies();
};