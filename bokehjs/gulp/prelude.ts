export const prelude = `\
(function(root, factory) {
  if(typeof exports === 'object' && typeof module === 'object')
    module.exports = factory();
  else if(typeof define === 'function' && define.amd)
    define([], factory);
  else if(typeof exports === 'object')
    exports["Bokeh"] = factory();
  else
    root["Bokeh"] = factory();
})(this, function(define /* void 0 */) {
  return (function(modules, entry) {
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
  })
`

export const plugin_prelude = `\
(function(root, factory) {
  if(typeof exports === 'object' && typeof module === 'object')
    factory(require("bokeh"));
  else if(typeof define === 'function' && define.amd)
    define(["bokeh"], factory);
  else if(typeof exports === 'object')
    factory(require("Bokeh"));
  else
    factory(root["Bokeh"]);
})(this, function(Bokeh, define /* void 0 */) {
  return (function(modules, entry) {
    if (Bokeh != null) {
      Bokeh.register_plugin(modules, entry);
    } else {
      throw new Error("Cannot find Bokeh. You have to load it prior to loading plugins.");
    }
  })
`
