function defaults (...args) {
  return Object.assign({}, ...args.reverse());
}

module.exports = defaults;
