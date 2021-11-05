const { parseArgsStringToArgv } = require('string-argv')
const minimist = require('minimist')
const chalk = require('chalk')
const gv = require('get-value')
const ld = require('lodash')
const parseInt = require('parse-int')
const op = require('object-path')
const { boolean } = require('boolean')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
dayjs.extend(utc)
dayjs.extend(timezone)
const curTimezone = dayjs.tz.guess()
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
  const filters = setFilterFunc(keys)
  setColorFunc(keys)

  let formatter
  if (options.outputAsArray) {
    formatter = function (json) {
      let data = ld.map(keys, (val, key) => {
        return val.renderColor(op.get(json, key, ''), json)
      })
      return data
    }
  } else {
    // credit https://stackoverflow.com/a/56112700/713573
    // let inject = (str, obj) => str.replace(/\${(.*?)}/g, (x,g)=> obj[g]);
    formatter = function (json) {
      return format.replace(/{(.*?)}/g, (x,key) => {
        return keys[key].renderColor(op.get(json, key, ''), json);
      })
    }
  }

  /**
   * Returns a function ready to pretify the json
   */
  function pretty (json, filter = true) {
    if (filter) {
      let isPassed = filters.every(test => test(json))
      if (isPassed) return formatter(json, options)
      else return false
    } else {
      return formatter(json, options)
    }
  }
  if (options.outputAsArray) {
    pretty.keysCount = (Object.keys(keys)).length
    pretty.keysSpan = ld.map(keys, (val, key) => parseInt(val.span))
  }
  return pretty
}

function parseTemplate (tpl) {
  const keys = {}
  const format = tpl.replace(/{(.*?)}/g, (x, arg) => {
    // console.log('key: x: %s, arg:', x, arg)
    let [key, args] = arg.split(/\s(.+)/)
    if (!args) args = ''
    const parsed = minimist(parseArgsStringToArgv(args), {
      string: ['f', 'l', 'w', 's'],
      default: {
        'c': false
      },
      alias: {
        c: 'color',
        e: 'exclude',
        f: 'filter',
        i: 'include',
        l: 'level',
        s: 'span',
        t: 'time',
        w: 'width'
      }
    })
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

function setColorFunc (keys) {
  ld.forEach(keys, (args, key) => {
    let renderColor = (str) => str;
    if (!args.color) {
      if (key === 'REST') {
        if (args['include-keys']) {
          let keys = args['include-keys'].split(',')
          renderColor = (str, json) => {
            return JSON.stringify(ld.pick(json, keys))
          }
        } else {
          let excludeKeys = ld.remove(ld.keys(keys), val => val !== 'REST')
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
      // TODO should be assigned at start or end
      args.renderColor = renderColor
    }
    if (args.time && typeof args.time === 'boolean') {
      args.renderColor = function (str, json) {
        return dayjs.tz(parseInt(str), curTimezone).format()
      }
    } else if (args.time && typeof args.time === 'string') {
      args.renderColor = function (str, json) {
        return dayjs.tz(parseInt(str), curTimezone).format(args.time) 
      }
    }
  })
}

function setFilterFunc (keys) {
  let filters = []
  ld.forEach(keys, (args, key) => {
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

