const t = require('tap')

const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
dayjs.extend(utc)
dayjs.extend(timezone)
const sinon = require('sinon')
sinon.stub(dayjs.tz, 'guess').returns('America/New_York')

const pretty = require('../lib/pretty.js')

// default
let pj = pretty() // pretty json
t.equal(
  pj({time:123, level: 'info', message: 'foo'}),
  "123 info foo",
  'no options'
)

// template
pj = pretty({template: '{level}: {message}'})
t.equal(
  pj({time:123, level: 'info', message: 'foo'}),
  "info: foo",
  'template as option'
)
t.notOk(pj.keysCount, 'output not an array, does not have keyCount')
t.notOk(pj.keysSpan, 'output not an array, does not have keysSpan')

// output as an array
pj = pretty({template: '{level}: {message}', outputAsArray: true})
t.deepEqual(
  pj({time:123, level: 'info', message: 'foo'}),
  ['info', 'foo'],
  'output as array'
)
t.equal(pj.keysCount, 2, 'output as an array with key\'s count')
t.ok(pj.keysSpan, 'output as an array without span has keySpan, ')
t.ok(pj.keysSpan, 'output as an array with out key\'s span')
t.deepEqual(pj.keysSpan, [undefined, undefined], 'output as an array without key\'s span array of undefined')

// output as an array with span
pj = pretty({template: '{level -s 10}: {message -s 30}', outputAsArray: true})
t.ok(pj.keysSpan, 'output as an array with key\'s span')
t.deepEqual(pj.keysSpan, [10, 30], 'output as an array with key\'s span number')

// include
pj = pretty({template: '{level -i info,debug} - {message}'})
t.equal(
  pj({time:123, level: 'info', message: 'foo'}),
  "info - foo",
  'included info, should print'
)

pj = pretty({template: '{level -i info,debug}: {message}'})
t.equal(
  pj({time:123, level: 'error', message: 'foo'}),
  false,
  'not included error, should not print'
)

// exclude
pj = pretty({template: '{level -e info}: {message}'})
t.equal(
  pj({time:123, level: 'info', message: 'foo'}),
  false,
  'exclude option'
)

pj = pretty({template: '{level -e info}: {message}'})
t.equal(
  pj({time:123, level: 'debug', message: 'foo'}),
  'debug: foo',
  'not excluded, should print'
)

// filter
pj = pretty({template: '{level} - {message -f "bar" }'})
t.equal(
  pj({time:123, level: 'info', message: 'foo bar'}),
  "info - foo bar",
  'filter, regex match, should print'
)

pj = pretty({template: '{level} - {message -f "baz" }'})
t.equal(
  pj({time:123, level: 'info', message: 'bar'}),
  false,
  'filter, regex does not match, should not print'
)

pj = pretty({template: '{level} - {message -f /foo/i }'})
t.equal(
  pj({time:123, level: 'info', message: 'FOO bar'}),
  "info - FOO bar",
  'filter, regex match with flags, should print'
)

// width
pj = pretty({template: '{level} - {message -w 3}'})
t.equal(
  pj({time:123, level: 'info', message: 'foo123'}),
  "info - foo...",
  'width, truncate from start'
)

pj = pretty({template: '{level} - {message -w=-3}'})
t.equal(
  pj({time:123, level: 'info', message: 'foo123'}),
  "info - ...123",
  'width, truncate backward'
)

// width: str width less than required
pj = pretty({template: '{level} - {message -w 30}'})
t.equal(
  pj({time:123, level: 'info', message: 'foo123'}),
  "info - foo123",
  'width, from start: do not truncate short string'
)

pj = pretty({template: '{level} - {message -w=-30}'})
t.equal(
  pj({time:123, level: 'info', message: 'foo123'}),
  "info - foo123",
  'width, truncate backward: do not truncate short string'
)

// level-key
pj = pretty({template: '{lvl --level-key}: {message}'})
t.equal(
  pj({time:123, lvl: 'info', message: 'foo'}),
  "info: foo",
  'custom level-key'
)

// special options
// level
pj = pretty({template: '{level -l warn}: {message}'})
t.equal(
  pj({time:123, level: 'error', message: 'foo'}),
  "error: foo",
  'print "error" as less than given "level" warn '
)
t.equal(
  pj({time:123, level: 'warn', message: 'foo'}),
  "warn: foo",
  'print "warn" as less than given "level" warn '
)
t.equal(
  pj({time:123, level: 'info', message: 'foo'}),
  false,
  'does not print "info" as not less than given "level" warn '
)

// REST
pj = pretty({template: '{level}: {message} {REST}'})
t.equal(
  pj({time:123, level: 'info', message: 'foo', extra: 'bar', name: 'baz'}),
  'info: foo {"time":123,"extra":"bar","name":"baz"}',
  'print REST keys as JSON string'
)

// include-keys
pj = pretty({template: '{level}: {message} {REST --include-keys=time,name}'})
t.equal(
  pj({time:123, level: 'info', message: 'foo', extra: 'bar', name: 'baz'}),
  'info: foo {"time":123,"name":"baz"}',
  'incldude specified keys in REST'
)

// exclude-keys
pj = pretty({template: '{level}: {message} {REST --exclude-keys=time,extra}'})
t.equal(
  pj({time:123, level: 'info', message: 'foo', extra: 'bar', name: 'baz'}),
  'info: foo {"name":"baz"}',
  'exclude specified keys in REST'
)

// print key with deep path
pj = pretty({template: '{level}: {message} {user.name}'})
t.equal(
  pj({time:123, level: 'info', message: 'foo', user: {name: 'baz'}}),
  'info: foo baz',
  'print key with deep path'
)

// time, convert to string
pj = pretty({template: '{time --time} - {message}'})
t.equal(
  pj({time:946684800000, level: 'info', message: 'foo'}),
  '1999-12-31T19:00:00-05:00 - foo',
  'print time to local string format'
)

// time, convert to given format
pj = pretty({template: '{time --time "[YYYYescape] YYYY-MM-DD T HH:mm:ss Z"} - {message}'})
t.equal(
  pj({time:946684800000, level: 'info', message: 'foo'}),
  'YYYYescape 1999-12-31 T 19:00:00 -05:00 - foo',
  'print time to given format'
)
