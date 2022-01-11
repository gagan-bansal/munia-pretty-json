const t = require('tap')
const fs = require('fs');
const path = require('path')
const cmd = require('../test/cmd-helper.js')

const cli = path.resolve(process.cwd(), './lib/cli.js')
const logFile = path.resolve(process.cwd(), './test/fixtures/json-log-with-error-key.json')

const output = fs.readFileSync('./test/fixtures/output-error-key.txt', 'utf8')

t.test('default print full error object', async t => {
  let resp = await cmd.execute(cli, [logFile], {env: {'FORCE_COLOR': 0}})
  t.equal(resp, output)
})

t.test('do not print full error object', async t => {
  let resp = await cmd.execute(cli, ['--error-key', false, logFile], {env: {'FORCE_COLOR': 0}})
  t.equal(resp, '946684800000 error print error message: foo\n')
})

