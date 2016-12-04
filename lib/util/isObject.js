function isObject (arg) {
  if (typeof arg !== 'object') return false;

  return arg === Object(arg) && !Array.isArray(arg);
}

module.exports = isObject;
