export const prelude = (entry: number, modules: string) => {
  return `\
(function(modules, entry) {
  var cache = {};

  var require = function(name) {
    if (!cache[name]) {
      if (!modules[name]) {
        var err = new Error("Cannot find module '" + name + "'");
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      var module = cache[name] = {exports: {}};
      modules[name].call(module.exports, require, module, module.exports);
    }

    return cache[name].exports;
  }

  var main = require(entry);
  main.require = require;

  main.register_plugin = function(plugin_modules, plugin_entry) {
    for (var name in plugin_modules) {
      modules[name] = plugin_modules[name];
    }

    var plugin = require(plugin_entry);

    for (var name in plugin) {
      main[name] = plugin[name];
    }
  }

  return main;
})(${modules}, ${entry});
`
}

export const plugin_prelude = (entry: number, modules: string) => {
  return `\
(function(modules, entry) {
  if (Bokeh != null) {
    Bokeh.register_plugin(modules, entry);
  } else {
    throw new Error("Cannot find Bokeh. You have to load it prior to loading plugins.");
  }
})(${modules}, ${entry});
`
}
