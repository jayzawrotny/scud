let _ = require('highland');
let defaults = require('./util/defaults');
let isObject = require('./util/isObject');

class Executor {
  constructor (commander, opts={}) {
    this.options = Object.assign({}, opts);
    this.commander = commander;
  }

  ////////////////////////////////////////////////////////////////////////////
  // PUBLIC API METHODS
  ////////////////////////////////////////////////////////////////////////////

  exec (...args) {
    return this.open(this.parseArgs(args), 'exec');
  }

  execOut (...args) {
    return this.exec(...args)
      .pluck('stdout');
  }

  execErr (...args) {
    return this.exec(...args)
      .pluck('stderr');
  }

  stream (...args) {
    return this.open(this.parseArgs(args), 'stream');
  }

  streamOut (...args) {
    return this.stream(...args)
      .filter((output) => output.stdout);
  }

  streamErr (...args) {
    return this.stream(...args)
      .filter((output) => output.stdout);
  }

  prompt (...args) {
    return this.open(this.parseArgs(args), 'prompt');
  }

  confirm (...args) {
    return this.open(this.parseArgs(args), 'confirm')
      .map((answer) => String(answer).toLowerCase() === 'y');
  }

  cd (dir) {
    this.commander.cd(this.cwd, dir).then((cwd) => {
      this.cwd = cwd;
    });
  }

  ////////////////////////////////////////////////////////////////////////////
  // INTERNAL METHODS
  ////////////////////////////////////////////////////////////////////////////

  open ({ cmd, values, options }, methodName) {
    return _((push, next) => {
      this.commander[methodName](cmd, values, options, {
        push: (...args) => push(...args),
        pushOut: (data) => push(null, data),
        pushErr: (err) => push(err),
        end: () => push(null, _.nil),
        next: (...args) => next(...args),
      });
    });
  }

  parseArgs (args) {
    let cmd = args.shift();
    let values = args.slice(0, -1);
    let opts = args.pop();

    if (this.cwd) cmd = `cd ${this.cwd} && ${cmd}`;

    if (!isObject(opts)) {
      values.push(opts);
      opts = {};
    }

    let options = defaults(opts, this.cwd && { cwd: this.cwd }, this.options);

    return {
      cmd,
      values,
      options,
    };
  }
}

module.exports = Executor;
