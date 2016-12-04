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
      .filter((output) => output.stdout)
      .pluck('stdout');
  }

  streamErr (...args) {
    return this.stream(...args)
      .filter((output) => output.stderr)
      .pluck('stderr');
  }

  prompt (...args) {
    return this.open(this.parseArgs(args), 'prompt');
  }

  confirm (...args) {
    let cmdArgs = this.parseArgs(args);

    cmdArgs.options = defaults(cmdArgs.options, {
      prompt: '(y/n) ',
    });

    return this.open(cmdArgs, 'confirm')
      .map((answer) => String(answer).toLowerCase() === 'y');
  }

  cd (dir) {
    return this.commander
      .cd(this.cwd, dir)
      .tap((cwd) => {
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
    let formatArgs = args.slice();
    let cmd = formatArgs.shift();
    let opts = formatArgs.pop();
    let values = formatArgs;

    if (this.cwd) cmd = `cd ${this.cwd} && ${cmd}`;

    if (opts && !isObject(opts)) {
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
