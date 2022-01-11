#!/usr/bin/env node

const pJson = require('../package.json')
const minimist = require('minimist')
const split = require('split')
const { createStream, getBorderCharacters } = require('table');
const border = getBorderCharacters('void')
// const chalkOrg = require('chalk')
// const chalk = new chalkOrg.Instance({level: 3});
const chalk = require('chalk');
const fs = require('fs')
const help = require('./help.js')
const Pretty = require('./pretty.js')

const argv = minimist(process.argv.slice(2), {
  string: ['l'],
  boolean: ['d', 'error-key', 'h', 'a', 'g'],
  default: {
    'd': false,
    'h': false,
    'error-key': true,
    't': '{time} {level -c} {message}',
    'k': 'level',
    'a': true
  },
  alias: {
    t: 'template',
    k: 'level-key',
    C: 'context',
    g: 'grid',
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
  'level-key': options['level-key'],
  outputAsArray: options.grid
})

let writeToConsole
if (argv.grid) {
  const tableStream = createStream({
    columnDefault: {
      width: 20,
      truncate: 100,
      wrapWord: true
    },
    columnCount: pretty.keysCount,
    columns: pretty.keysSpan.map(span => {
      return {width: (span || 20)}
    })
  })
  writeToConsole = function (arr) {
    tableStream.write(arr)
  }
} else {  // this is default
  writeToConsole = function (str) {
    process.stdout.write(str + '\n')
  }
}
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
    if (opts.debug) {
      console.log(line)
      console.error(err)
    }
    return {raw: line}
  }
  let formatted = pretty(data)
  if (opts['error-key'] && data.error) {
    formatted = formatted + '\n'
      + chalk.red(
        JSON.stringify(data.error, null, 2).replace(/\\n/g, '\n')
      )
  }
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
      before.forEach(data => writeToConsole(pretty(data, false)))
    }
    before = []
    writeToConsole(out.output)
    afterEnabled = argv.context
  } else if (argv.context && out.discarded) {
    //console.log('discarded: ' + out.discarded.message)
    if (afterEnabled >= 0) {
      writeToConsole(pretty(out.discarded, false))
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
