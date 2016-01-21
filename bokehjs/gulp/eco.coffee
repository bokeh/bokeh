path = require 'path'
merge = require 'merge'
through = require 'through2'
gutil = require 'gulp-util'
coffee = require 'coffee-script'
eco = require 'eco'

#{preprocess} = require "eco/preprocessor"

#precompile = (source) ->
#  script = coffee.compile(preprocess(source), {noWrap: true})

module.exports = (opt) ->
  transform = (file, enc, cb) ->
    if file.isNull()
      return cb(null, file)
    if file.isStream()
      return cb(new PluginError('gulp-eco', 'Streaming not supported'))

    str = file.contents.toString('utf8')
    dest = gutil.replaceExtension(file.path, '.js')

    options = merge({}, opt)

    try
      data = "module.exports = #{eco.precompile(str, options)};"
    catch err
      return cb(new PluginError('gulp-eco', err))

    file.contents = new Buffer(data)
    file.path = dest

    return cb(null, file)

  return through.obj(transform)
