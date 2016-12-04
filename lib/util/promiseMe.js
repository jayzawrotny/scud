function promiseMe (fn, ...args) {
  return new Promise((resolve, reject) => {
    fn(...args, (err, ...results) => {
      if (err !== null) return reject(err);

      resolve(results);
    });
  });
}

module.exports = promiseMe;
