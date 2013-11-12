CoffeeScript = require "coffee-script"
{preprocess} = require "./preprocessor"
{indent}     = require "./util"

exports.compile = compile = (source) ->
  script = CoffeeScript.compile preprocess(source), noWrap: true

  """
    module.exports = function(__obj) {
      var _safe = function(value) {
        if (typeof value === 'undefined' && value == null)
          value = '';
        var result = new String(value);
        result.ecoSafe = true;
        return result;
      };
      return (function() {
        var __out = [], __self = this, _print = function(value) {
          if (typeof value !== 'undefined' && value != null)
            __out.push(value.ecoSafe ? value : __self.escape(value));
        }, _capture = function(callback) {
          var out = __out, result;
          __out = [];
          callback.call(this);
          result = __out.join('');
          __out = out;
          return _safe(result);
        };
    #{indent script, 4}
        return __out.join('');
      }).call((function() {
        var obj = {
          escape: function(value) {
            return ('' + value)
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;');
          },
          safe: _safe
        }, key;
        for (key in __obj) obj[key] = __obj[key];
        return obj;
      })());
    };
  """

exports.render = (source, data) ->
  module = {}
  template = new Function "module", compile source
  template module
  module.exports data

if require.extensions
  require.extensions[".eco"] = (module, filename) ->
    source = require("fs").readFileSync filename, "utf-8"
    module._compile compile(source), filename

else if require.registerExtension
  require.registerExtension ".eco", compile
