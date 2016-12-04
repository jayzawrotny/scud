let Executor = require('../lib/Executor');

after(clearRequireCache);
after(restoreSpies);

describe('Executor', () => {
  describe('#constructor()', () => {
    it('Should take a commander and options', () => {
      let executor = new Executor({ hello: 'world' }, { test: true });

      expect(executor).toBeA(Executor);
      expect(executor.commander.hello).toBe('world');
      expect(executor.options.test).toBe(true);
    });
  });

  describe('#exec()', () => {
    it('Should call open & parseArgs', () => {
      let executor = new Executor();
      let parseSpy = expect.spyOn(executor, 'parseArgs').andCallThrough();
      let openSpy = expect.spyOn(executor, 'open');

      executor.exec('one', 'two', 'three');

      expect(openSpy).toHaveBeenCalled();
      expect(openSpy.calls[0].arguments).toEqual([
        {
          cmd: 'one',
          options: {},
          values: ['two', 'three'],
        },
        'exec',
      ]);
      expect(parseSpy).toHaveBeenCalled();
      expect(parseSpy).toHaveBeenCalledWith([ 'one', 'two', 'three' ]);
    });
  });

  describe('#execOut()', () => {
    it('Should call exec and pluck the stdout property', () => {
      let executor = new Executor();
      let execSpy = expect.spyOn(executor, 'exec').andCall(() => {
        return _.of({ stdout: 'hello world' });
      });

      return executor.execOut()
        .inspect((err, stdout) => {
          expect(execSpy).toHaveBeenCalled();
          expect(stdout).toBe('hello world');
        })
        .toPromise();
    });
  });

  describe('#execErr()', () => {
    it('Should call exec and pluck the stderr property', () => {
      let executor = new Executor();
      let execSpy = expect.spyOn(executor, 'exec').andCall(() => {
        return _.of({ stderr: 'hello world' });
      });

      return executor.execErr()
        .inspect((err, stderr) => {
          expect(execSpy).toHaveBeenCalled();
          expect(stderr).toBe('hello world');
        })
        .toPromise();
    });
  });

  describe('#stream()', () => {
    it('Should call open & parseArgs', () => {
      let executor = new Executor();
      let parseSpy = expect.spyOn(executor, 'parseArgs').andCallThrough();
      let openSpy = expect.spyOn(executor, 'open');

      executor.stream('one', 'two', 'three');

      expect(openSpy).toHaveBeenCalled();
      expect(openSpy.calls[0].arguments).toEqual([
        {
          cmd: 'one',
          options: {},
          values: ['two', 'three'],
        },
        'stream',
      ]);
      expect(parseSpy).toHaveBeenCalled();
      expect(parseSpy).toHaveBeenCalledWith([ 'one', 'two', 'three' ]);
    });
  });

  describe('#streamOut()', () => {
    it('Should call exec and filter the stdout property', () => {
      let executor = new Executor();
      let streamSpy = expect.spyOn(executor, 'stream').andCall(() => {
        return _([
          { stdout: 'hello world', stderr: '' },
          { stdout: '', stderr: 'You can\'t see me' },
        ]);
      });

      return executor.streamOut()
        .inspect((err, stdout) => {
          expect(streamSpy).toHaveBeenCalled();
          expect(stdout).toBe('hello world');
        })
        .toPromise();
    });
  });

  describe('#streamErr()', () => {
    it('Should call exec and filter the stderr property', () => {
      let executor = new Executor();
      let streamSpy = expect.spyOn(executor, 'stream').andCall(() => {
        return _([
          { stderr: 'hello world', stdout: '' },
          { stderr: '', stdout: 'You can\'t see me' },
        ]);
      });

      return executor.streamErr()
        .inspect((err, stderr) => {
          expect(streamSpy).toHaveBeenCalled();
          expect(stderr).toBe('hello world');
        })
        .toPromise();
    });
  });

  describe('#prompt()', () => {
    it('Should call open & parseArgs', () => {
      let executor = new Executor();
      let parseSpy = expect.spyOn(executor, 'parseArgs').andCallThrough();
      let openSpy = expect.spyOn(executor, 'open');

      executor.prompt('one', 'two', 'three');

      expect(openSpy).toHaveBeenCalled();
      expect(openSpy.calls[0].arguments).toEqual([
        {
          cmd: 'one',
          options: {},
          values: ['two', 'three'],
        },
        'prompt',
      ]);
      expect(parseSpy).toHaveBeenCalled();
      expect(parseSpy).toHaveBeenCalledWith([ 'one', 'two', 'three' ]);
    });
  });

  describe('#confirm()', () => {
    it('Should call open & parseArgs', () => {
      let executor = new Executor();
      let parseSpy = expect.spyOn(executor, 'parseArgs').andCallThrough();
      let openSpy = expect.spyOn(executor, 'open');

      openSpy.andCall(() => {
        return _.of('y');
      });

      executor.confirm('one', 'two', 'three');

      expect(openSpy).toHaveBeenCalled();
      expect(openSpy.calls[0].arguments).toEqual([
        {
          cmd: 'one',
          options: {
            prompt: '(y/n) ',
          },
          values: ['two', 'three'],
        },
        'confirm',
      ]);
      expect(parseSpy).toHaveBeenCalled();
      expect(parseSpy).toHaveBeenCalledWith([ 'one', 'two', 'three' ]);
    });

    it('Should parse any y answer values to true', () => {
      let executor = new Executor();
      let openSpy = expect.spyOn(executor, 'open');

      openSpy.andCall(() => {
        return _([
          'Y',
          'y',
        ]);
      });

      return executor.confirm('What is your favorite drink?')
        .inspect((err, answer) => {
          expect(answer).toBe(true);
        })
        .toPromise();
    });

    it('Should parse any non-y answer values to false', () => {
      let executor = new Executor();
      let openSpy = expect.spyOn(executor, 'open');

      openSpy.andCall(() => {
        return _([
          'n',
          'N',
          'yy',
          '',
          'other text',
        ]);
      });

      return executor.confirm('What is your favorite drink?')
        .inspect((err, answer) => {
          expect(answer).toBe(false);
        })
        .toPromise();
    });
  });

  describe('#cd()', () => {
    it('Should change the current working directory', () => {
      let cdSpy = expect.createSpy();
      let executor = new Executor({ cd: cdSpy });

      cdSpy.andCall((cwd, dir) => {
        expect(cwd).toNotExist();
        expect(dir).toBe('lib');
        return _.of(dir);
      });

      return executor.cd('lib')
        .inspect((err, cwd) => {
          expect(executor.cwd).toBe('lib');
          expect(cwd).toBe('lib');
        })
        .toPromise();
    });
    it('Should change the current working directory relative to previous', () => {
      let cdSpy = expect.createSpy();
      let executor = new Executor({ cd: cdSpy });
      let path = require('path');

      cdSpy.andCall((cwd='', dir) => {
        return _.of(path.join(cwd, dir));
      });

      return executor.cd('base')
        .inspect((err, cwd) => {
          expect(executor.cwd).toBe('base');
          expect(cwd).toBe('base');
        })
        .flatMap(() => executor.cd('lib'))
        .inspect((err, cwd) => {
          expect(executor.cwd).toBe('base/lib');
          expect(cwd).toBe('base/lib');
        })
        .toPromise();
    });

    it('Should prefix subsequent commands with the cwd', () => {
      let cdSpy = expect.createSpy();
      let executor = new Executor({ cd: cdSpy });
      let openSpy = expect.spyOn(executor, 'open');

      cdSpy.andCall((cwd='', dir) => {
        return _.of(dir);
      });

      openSpy.andCall(() => {
        return _.of({ stdout: 'hello world', stderr: '' });
      });

      return executor.cd('base')
        .inspect((err, cwd) => {
          expect(executor.cwd).toBe('base');
          expect(cwd).toBe('base');
        })
        .flatMap(() => executor.exec('hello world'))
        .inspect(() => {
          let args = openSpy.calls[0].arguments[0];

          expect(args.cmd).toBe('cd base && hello world');
          expect(args.options).toEqual({ cwd: 'base' });
          expect(args.values).toEqual([]);
        })
        .toPromise();
    });
  });

  describe('#open()', () => {
    it('Should call the target method on the commander');
    it('Should provide a stream-like interface to the commander');
    it('Should send data from stream-like interface');
  });

  describe('#parseArgs()', () => {
    it('Should return a cmd, values, and empty options if not an object');
    it('Should return a cmd, values, and options object');
  });
});
