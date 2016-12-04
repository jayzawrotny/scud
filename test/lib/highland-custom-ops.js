let _ = require('highland');

let proto = Object.getPrototypeOf(_());

function addMethod (methodName, func) {
  _.extend({ [methodName]: func }, proto);
}

addMethod('delay', function delay (ms) {
  return this.consume((err, x, push, next) => {
    setTimeout(() => {
      push(err, x);
      if (x !== _.nil) next();
    }, ms);
  });
});

addMethod('nextTick', function nextTick () {
  return this.consume((err, x, push, next) => {
    process.nextTick(() => {
      push(err, x);
      if (x !== _.nil) next();
    });
  });
});

addMethod('log', function log (...args) {
  return this.tap((x) => {
    _.log(...args.concat([x]));
  });
});

addMethod('invokeLog', function invokeLog (fnName, fnArgs=[], ...args) {
  return this.map((x) => {
    let result = x[fnName](...fnArgs);

    _.log(...args.concat(result));

    return x;
  });
});

addMethod('toPromise', function toPromise () {
  let self = this;

  return new Promise((resolve, reject) => {
    self.consume((err, result, push, next) => {
      if (err !== null) return reject(err);
      resolve(result);
      next();
    }).resume();
  });
});

addMethod('inspect', function expect (cb) {
  let hasValue = false;

  return this.consume((err, x, push, next) => {
    if (err) {
      throw err;
    }
    else if (x === _.nil) {
      // ensure our cb gets called at least once
      if (!hasValue) cb();
      push(null, x);
    }
    else {
      hasValue = true;
      cb(null, x);
      push(null, x);
      next();
    }
  });
});
