let _ = require('highland');
let cp = require('child_process');
let defaults = require('../util/defaults');
let format = require('util').format;
let path = require('path');
let promiseMe = require('../util/promiseMe');
let readline = require('readline');

class LocalCommander {
  constructor (executor, opts={}) {
    this.executor = executor;
    this.options = defaults(opts, {
    });
  }

  cd (cwd, dir) {
    return new Promise(() => {
      if (dir.slice(0, 1) === '/') return dir;

      if (!cwd) cwd = process.cwd();

      return path.join(cwd, dir);
    });
  }

  exec (cmd, values, opts, stream) {
    let options = defaults(opts, this.options, {

    });

    promiseMe(cp.exec, format(cmd, values), options)
      .then(([ stdout, stderr ]) => {
        stream.pushOut({
          stdout: stdout.toString('utf8'),
          stderr: stderr.toString('utf8'),
        });
      })
      .catch(stream.pushErr)
      .then(stream.end);
  }

  stream (cmd, values, opts, stream) {
    let options = defaults(opts, this.options, {
      stdio: 'inherit',
    });

    let cmdArgs = format(cmd, values).split(' ');
    let child = cp.spawn(cmdArgs[0], cmdArgs.slice(1), options);
    let errStream = _(child.stderr).map((stderr) => ({
      stdout: '',
      stderr: stderr.toString('utf8'),
    }));
    let outStream = _(child.stdout).map((stdout) => ({
      stdout: stdout.toString('utf8'),
      stderr: '',
    }));

    errStream.apply(stream.pushErr);
    outStream.apply(stream.pushOut);

    child.once('close', () => {
      errStream.end();
      outStream.end();
      stream.end();
    });
  }

  prompt (cmd, values, opts, stream) {
    let options = defaults(opts, {
      input: process.stdin,
      stdout: process.stdout,
      prompt: '> ',
    });

    let rl = readline.createInterface(options);

    if (cmd) options.output.write(format(cmd, values) + '\n');

    rl.prompt();
    rl.on('line', (line) => {
      stream.pushOut(line.trim());
    });
    rl.once('close', () => {
      stream.end();
      rl.removeListener('line');
    });
  }

  confirm (question, values, opts, stream) {
    return this.prompt(question, values, defaults(opts, {
      prompt: '(y/n) ',
    }), stream);
  }
}

module.exports = LocalCommander;
