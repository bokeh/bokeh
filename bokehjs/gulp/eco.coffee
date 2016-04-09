path = require 'path'
through = require 'through2'
gutil = require 'gulp-util'
coffee = require 'coffee-script'
eco = require 'eco'

{preprocess} = require "eco/src/preprocessor"
{indent}     = require "eco/src/util"

precompile = (source) ->
  script = coffee.compile(preprocess(source), {noWrap: true})

  return """
    function(__obj) {
      if (!__obj) __obj = {};
      var __out = [], __capture = function(callback) {
        var out = __out, result;
        __out = [];
        callback.call(this);
        result = __out.join('');
        __out = out;
        return __safe(result);
      }, __sanitize = function(value) {
        if (value && value.ecoSafe) {
          return value;
        } else if (typeof value !== 'undefined' && value != null) {
          return __escape(value);
        } else {
          return '';
        }
      }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
      __safe = __obj.safe = function(value) {
        if (value && value.ecoSafe) {
          return value;
        } else {
          if (!(typeof value !== 'undefined' && value != null)) value = '';
          var result = new String(value);
          result.ecoSafe = true;
          return result;
        }
      };
      if (!__escape) {
        __escape = __obj.escape = function(value) {
          return ('' + value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\x22/g, '&quot;');
        };
      }
      (function() {
    #{indent(script, 4)}
      }).call(__obj);
      __obj.safe = __objSafe, __obj.escape = __escape;
      return __out.join('');
    }
  """

module.exports = (opt) ->
  transform = (file, enc, cb) ->
    if file.isNull()
      return cb(null, file)
    if file.isStream()
      return cb(new PluginError('gulp-eco', 'Streaming not supported'))

    str = file.contents.toString('utf8')
    dest = gutil.replaceExtension(file.path, '.js')

    try
      data = "module.exports = #{precompile(str)};"
    catch err
      return cb(new PluginError('gulp-eco', err))

    file.contents = new Buffer(data)
    file.path = dest

    return cb(null, file)

  return through.obj(transform)
