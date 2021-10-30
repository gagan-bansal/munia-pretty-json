#!/usr/bin/env node

const pJson = require('../package.json')
const minimist = require('minimist')
const split = require('split')
// const chalkOrg = require('chalk')
// const chalk = new chalkOrg.Instance({level: 3});
const fs = require('fs')
const help = require('./help.js')
const Pretty = require('./pretty.js')

const argv = minimist(process.argv.slice(2), {
  string: ['l'],
  boolean: ['d', 'h', 'a'],
  default: {
    'd': false,
    'h': false,
    't': '{time} {level -c} {message}',
    'k': 'level',
    'a': true
  },
  alias: {
    t: 'template',
    k: 'level-key',
    C: 'context',
    a: 'all',
    d: 'debug',
    h: 'help',
    v: 'version'
  }
})
//console.log(argv)
const options = argv
const pretty = Pretty({
  template: argv.template,
  'level-key': options['level-key']})
let before = []
let after = []
let afterEnabled = 0

if (argv.help) {
  console.log(help())
} else if (argv.version) {
  console.log(pJson.version)
} else if (argv._.length > 0) {
  fs.createReadStream(argv._[0]).pipe(split())
  .on('data', (line => {
    processLine(line, options)
  }))
  .on('end', () => {
    // process.stdin.pipe(split()).on('data', processLine)
  })
} else {
  process.stdin.pipe(split()).on('data', function (line) {
    processLine(line, options)
    //if (out.output) console.log(out.output)
  })
}

function formatLine (line, opts) {
  let output, discarded
  try {
    data = JSON.parse(line)
  } catch(err) {
    if (opts.debug) console.error(err)
    return {raw: line}
  }
  let formatted = pretty(data)
  if (formatted) {
    return {output: formatted}
  } else {
    return {discarded: data}
  }
}

function processLine (line, options) {
  //console.log('line: ' + line)
  afterEnabled -= 1
  let out = formatLine(line, options)
  if (out.output) {
    if (before.length > 0) {
      console.log('...')
      before.forEach(data => process.stdout.write(pretty(data, false) + '\n'))
    }
    before = []
    process.stdout.write(out.output + '\n')
    afterEnabled = argv.context
  } else if (argv.context && out.discarded) {
    //console.log('discarded: ' + out.discarded.message)
    if (afterEnabled >= 0) {
      process.stdout.write(pretty(out.discarded, false) + '\n')
      if (afterEnabled === 0) console.log('...')
    } else {
      if (after.length > 0)
      after = []
      before = addBefore(out.discarded, before, argv.context)
    }
  } else if (options.all && out.raw) {
    console.log(out.raw)
  }
}

function addBefore(ele, array, context) {
  if (array.length === context) {
    array.shift();
  }
  array.push(ele);
  return array;
}
