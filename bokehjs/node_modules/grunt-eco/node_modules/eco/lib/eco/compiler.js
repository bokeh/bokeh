(function() {
  var CoffeeScript, compile, indent, preprocess;
  CoffeeScript = require("coffee-script");
  preprocess = require("./preprocessor").preprocess;
  indent = require("./util").indent;
  exports.compile = compile = function(source) {
    var script;
    script = CoffeeScript.compile(preprocess(source), {
      noWrap: true
    });
    return "module.exports = function(__obj) {\n  var _safe = function(value) {\n    if (typeof value === 'undefined' && value == null)\n      value = '';\n    var result = new String(value);\n    result.ecoSafe = true;\n    return result;\n  };\n  return (function() {\n    var __out = [], __self = this, _print = function(value) {\n      if (typeof value !== 'undefined' && value != null)\n        __out.push(value.ecoSafe ? value : __self.escape(value));\n    }, _capture = function(callback) {\n      var out = __out, result;\n      __out = [];\n      callback.call(this);\n      result = __out.join('');\n      __out = out;\n      return _safe(result);\n    };\n" + (indent(script, 4)) + "\n    return __out.join('');\n  }).call((function() {\n    var obj = {\n      escape: function(value) {\n        return ('' + value)\n          .replace(/&/g, '&amp;')\n          .replace(/</g, '&lt;')\n          .replace(/>/g, '&gt;')\n          .replace(/\"/g, '&quot;');\n      },\n      safe: _safe\n    }, key;\n    for (key in __obj) obj[key] = __obj[key];\n    return obj;\n  })());\n};";
  };
  exports.render = function(source, data) {
    var module, template;
    module = {};
    template = new Function("module", compile(source));
    template(module);
    return module.exports(data);
  };
  if (require.extensions) {
    require.extensions[".eco"] = function(module, filename) {
      var source;
      source = require("fs").readFileSync(filename, "utf-8");
      return module._compile(compile(source), filename);
    };
  } else if (require.registerExtension) {
    require.registerExtension(".eco", compile);
  }
}).call(this);
