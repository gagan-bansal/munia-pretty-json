/**
 * Integration test helper
 * Author: Andrés Zorro <zorrodg@gmail.com>
 * Source: https://medium.com/@zorrodg/integration-tests-on-node-js-cli-part-1-why-and-how-fa5b1ba552fe
 */

const concat = require('concat-stream');
const spawn = require('child_process').spawn;

function execute(processPath, args = [], opts = {}) {
  const { env = null } = opts;
  const childProcess = createProcess(processPath, args, env);
  childProcess.stdin.setEncoding('utf-8');  const promise = new Promise((resolve, reject) => {
    childProcess.stderr.once('data', err => {
      reject(err.toString());
    });    childProcess.on('error', reject);    childProcess.stdout.pipe(
      concat(result => {
        resolve(result.toString());
      })
    );
  });  return promise;
}

function createProcess(processPath, args = [], env = null) {
  args = [processPath].concat(args);
  return spawn('node', args, {
    env: Object.assign(
      {
        NODE_ENV: 'test'
      },
      env
    )
  });
}

module.exports = { execute };
