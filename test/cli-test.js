const t = require('tap')
const fs = require('fs');
const path = require('path')
const cmd = require('../test/cmd-helper.js')

const cli = path.resolve(process.cwd(), './lib/cli.js')
const logFile = path.resolve(process.cwd(), './test/fixtures/json-log.json')

const output = fs.readdirSync(path.resolve(__dirname, 'fixtures'))
  .filter(f => /\.txt$/.test(f))
  .reduce((obj, file) => {
    obj[file.replace(/\.txt$/, '')]
      = fs.readFileSync(path.resolve(__dirname, 'fixtures', file), 'utf8')
    return obj
  }, {})

t.test('default output', async t => {
  let resp = await cmd.execute(cli, [logFile], {env: {'FORCE_COLOR': 3}})
  t.equal(resp, output['output-default'])
})

t.test('output only json records', async t => {
  let resp = await cmd.execute(
    cli,
    [logFile, '-a', false],
    {env: {'FORCE_COLOR': 3}}
  )
  t.equal(resp, output['output-only-json'])
})

t.test('output with template', async t => {
  let resp = await cmd.execute(
    cli,
    [
      logFile, '-a', false,
      '-t', '{level -c}: {message}'
    ],
    {env: {'FORCE_COLOR': 3}}
  )
  t.equal(resp, output['output-with-template'])
})

t.test('output with context', async t => {
  let resp = await cmd.execute(
    cli,
    [
      logFile, '-a', false,
      '-C', 2,
      '-t', '{level -c -i http}: {message}'
    ],
    {env: {'FORCE_COLOR': 3}}
  )
  t.equal(resp, output['output-with-context'])
})

t.test('output as grid/table', async t => {
  let resp = await cmd.execute(
    cli,
    [
      logFile,
      '-a', false,
      '-g',
      '-t', '{time} - {level -c -s 10} - {message -s 10}'
    ],
    {env: {'FORCE_COLOR': 3}}
  )
  t.equal(resp, output['output-as-grid'])
})
