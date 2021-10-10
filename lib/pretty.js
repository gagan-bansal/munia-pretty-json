const { parseArgsStringToArgv } = require('string-argv')
const minimist = require('minimist')
const chalk = require('chalk')
const gv = require('get-value')
const ld = require('lodash')
const op = require('object-path')
const { boolean } = require('boolean')
const getRandomColor = require('./random-color.js')

const defaultLevels = ['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly']
const defaultLevelsColors = {
  error: chalk.bold.redBright,
  warn: chalk.bold.rgb(255, 136, 0),
  info: chalk.bold.greenBright,
  http: chalk.bold.rgb(190, 190, 190),
  verbose: chalk.bold.cyanBright,
  debug: chalk.bold.blueBright,
  silly: chalk.bold.magentaBright
}

module.exports = function (options = {}) {
  const template = options.template || '{time} {level -c} {message}'
  const [format, keys] = parseTemplate(template)
  options.format = format
  options.keys = keys

  setColorFunc(options)
  options.filters = setFilterFunc(options)

  /**
   * Returns a function ready to pretify the json
   */
  return function pretty (json, filter = true) {
    if (filter) {
      let isPassed = options.filters.every(test => test(json))
      if (isPassed) return formatter(json, options)
      else return false
    } else {
      return formatter(json, options)
    }
  }
}

function parseTemplate (tpl) {
  const keys = {}
  const format = tpl.replace(/{(.*?)}/g, (x, arg) => {
    // console.log('key: x: %s, arg:', x, arg)
    let [key, args] = arg.split(/\s(.+)/)
    if (!args) args = ''
    const parsed = minimist(parseArgsStringToArgv(args), {
      string: ['f', 'l', 'w'],
      default: {
        'c': false
      },
      alias: {
        c: 'color',
        i: 'include',
        e: 'exclude',
        f: 'filter',
        w: 'width',
        l: 'level'
      }
    })
    // console.log(parsed)
    if (parsed.width) parsed.width = parseInt(parsed.width)
    if (parsed.include) parsed.include = parsed.include.split(',')
    if (parsed.exclude) parsed.exclude = parsed.exclude.split(',')
    if (parsed.colors) parsed.colors = parsed.colors.split(',')
      .reduce( (grp, pair) => {
        let [key, val] = pair.split(':')
        grp[key] = val
        return grp
      },{})
    if (parsed.hasOwnProperty('level-key'))
      parsed['level-key'] = boolean(parsed['level-key'])
    keys[key] = parsed
    return `{${key}}`
  })
  return [format, keys]
}

function setColorFunc (options) {
  ld.forEach(options.keys, (args, key) => {
    let renderColor = (str) => str;
    if (!args.color) {
      if (key === 'REST') {
        if (args['include-keys']) {
          let keys = args['include-keys'].split(',')
          renderColor = (str, json) => {
            return JSON.stringify(ld.pick(json, keys))
          }
        } else {
          let excludeKeys = ld.remove(ld.keys(options.keys), val => val !== 'REST')
          let moreKeys
          if (args['exclude-keys']) {
            moreKeys = args['exclude-keys'].split(',')
            excludeKeys = [...excludeKeys, ...moreKeys]
          }
          renderColor = (str, json) => {
            return JSON.stringify(ld.omit(json, excludeKeys))
          }
        }
      } else {
        renderColor = (str) => str;
      }
    } else {
      debugger
      if (args.values) {
        // TODO how to create function for each value
        // also if colors are given then
        let valuesColorMap = args.values.reduce( (map, val) => {
          let hexColor = getRandomColor(val)
          map[val] = chalk.bold.hex(hexColor)
          return map
        }, {})
        renderColor = (str) => {
          return valuesColorMap[str] ? valuesColorMap[str](str) : str
        }
      } else if (args['level-key'] || (
        key === 'level' && (args.hasOwnProperty('level-key') ? args['level-key'] : true))
      ) {
        renderColor = (str) => {
          if (defaultLevelsColors[str]) {
            return defaultLevelsColors[str](str)
          } else {
            let hexColor = getRandomColor(str)
            return chalk.hex(hexColor).bold(str)
          }
        }
      } else {
        renderColor = (str) => {
          let hexColor = getRandomColor(str)
          return chalk.hex(hexColor).bold(str)
        }
      }
    }
    if (args.width) {
      if (args.width < 0) {
        args.renderColor = function (str, json) {
          return renderColor('...' + str.substring(str.length + args.width),
            json)
        }
      } else {
        args.renderColor = function (str, json) {
          return renderColor(str.substring(0, args.width) + '...' , json)
        }
      }
    } else {
      args.renderColor = renderColor
    }
  })
}

function setFilterFunc (options) {
  let filters = []
  ld.forEach(options.keys, (args, key) => {
    if (args.filter) {
      let str, reStr, flags, re
      if (/^\//.test(args.filter)) {
        [str, reStr, flags] = args.filter.match('\/(.*)\/(.*)$')
      } else {
         reStr = args.filter
      }
      if (flags) re = new RegExp(reStr, flags)
      else re = new RegExp(reStr, flags)
      let test = function (json) {
        return re.test(json[key])
      }
      filters.push(test)
    }
    if (args.level) {
      let lvlIndex = defaultLevels.indexOf(args.level)
      if (lvlIndex< 0)
        throw new Error('invalid value of "level(l)"')
      let reStr = defaultLevels.slice(0, lvlIndex + 1)
      let re = new RegExp('^(' + reStr.join('|') + ')$')
      let test = function (json) {
        return re.test(json[key])
      }
      filters.push(test)
    }
    if (args.include) {
      let re = new RegExp('^(' + args.include.join('|') + ')$')
      let test = function (json) {
        return re.test(json[key])
      }
      filters.push(test)
    }
    if (args.exclude) {
      let re = new RegExp('^(' + args.exclude.join('|') + ')$')
      let test = function (json) {
        return !re.test(json[key])
      }
      filters.push(test)
    }
  })
  return filters
}

// credit https://stackoverflow.com/a/56112700/713573
// let inject = (str, obj) => str.replace(/\${(.*?)}/g, (x,g)=> obj[g]);

function formatter (json, options) {
  return options.format.replace(/{(.*?)}/g, (x,key) => {
    return options.keys[key].renderColor(op.get(json, key, ''), json);
  })
}
