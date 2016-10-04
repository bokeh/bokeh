path = require 'path'
through = require 'through2'
gutil = require 'gulp-util'
coffee = require 'coffee-script'

{preprocess} = require "eco/lib/preprocessor"
{indent}     = require "eco/lib/util"

helpers = """
var __capture = function(callback) {
  var out = __out, result;
  __out = [];
  callback.call(this);
  result = __out.join('');
  __out = out;
  return __safe(result);
};
var __sanitize = function(value) {
  if (value && value.ecoSafe) {
    return value;
  } else if (typeof value !== 'undefined' && value != null) {
    return __escape(value);
  } else {
    return '';
  }
};
var __safe = function(value) {
  if (value && value.ecoSafe) {
    return value;
  } else {
    if (!(typeof value !== 'undefined' && value != null)) value = '';
    var result = new String(value);
    result.ecoSafe = true;
    return result;
  }
};
var __escape = function(value) {
  return ('' + value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\x22/g, '&quot;');
};
"""

compile = (source) ->
  script = coffee.compile(preprocess(source), {noWrap: true})

  return """
    function(__obj) {
      if (!__obj) __obj = {};
      var __out = [];
    #{indent(helpers, 2)}
      (function() {
    #{indent(script.replace(/\n\n+/g, "\n").trim(), 4)}
      }).call(__obj);
      return __out.join('');
    }
  """

eco = (opt) ->
  transform = (file, enc, cb) ->
    if file.isNull()
      return cb(null, file)
    if file.isStream()
      return cb(new PluginError('gulp-eco', 'Streaming not supported'))

    str = file.contents.toString('utf8')
    dest = gutil.replaceExtension(file.path, '.js')

    try
      data = "module.exports = #{compile(str)};"
    catch err
      return cb(new PluginError('gulp-eco', err))

    file.contents = new Buffer(data)
    file.path = dest

    return cb(null, file)

  return through.obj(transform)

module.exports = {
  compile: compile
  eco: eco
}
