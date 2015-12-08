gulp = require "gulp"
paths = require "../paths"
es = require "event-stream"
coffeelint = require('gulp-coffeelint')

rule_levels = {
  'max_line_length' : 'ignore'

  # This is disabled because @register_property and @listenTo
  # cause false positives since they automatically set up `this`
  # 'missing_fat_arrows' : 'warn'

  # this should DEFINITELY not be ignored but fixing one thing at
  # a time...
  'duplicate_key' : 'ignore'

  # these should probably be enabled, though it's fairly annoying
  # to have a linter that complains about whitespace when it could
  # just auto-fix it. So we could consider adding a formatter
  # instead.
  'no_trailing_whitespace' : 'ignore'
  'indentation' : 'ignore'
  'no_trailing_semicolons' : 'ignore'
  'no_tabs' : 'ignore'
}

options = {}

for k, v of rule_levels
  options[k] = { 'level' : v }

gulp.task "lint", ->
  gulp.src('./src/coffee/**/*.coffee')
    .pipe(coffeelint(null, options))
    .pipe(coffeelint.reporter())
