const t = require('tap')

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

pj = pretty({template: '{level} - {message -w 3}'})
t.equal(
  pj({time:123, level: 'info', message: 'foo123'}),
  "info - foo...",
  'width, truncate from start'
)

// width
pj = pretty({template: '{level} - {message -w=-3}'})
t.equal(
  pj({time:123, level: 'info', message: 'foo123'}),
  "info - ...123",
  'width, truncate backward'
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

