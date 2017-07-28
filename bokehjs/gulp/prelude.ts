export const prelude = `\
(function(root, factory) {
//  if(typeof exports === 'object' && typeof module === 'object')
//    module.exports = factory();
//  else if(typeof define === 'function' && define.amd)
//    define("Bokeh", [], factory);
//  else if(typeof exports === 'object')
//    exports["Bokeh"] = factory();
//  else
    root["Bokeh"] = factory();
})(this, function() {
  var define;
  return (function(modules, aliases, entry) {
    var cache = {};

    var require = function(name) {
      var id = aliases[name] != null ? aliases[name] : name;

      if (!cache[id]) {
        if (!modules[id]) {
          var err = new Error("Cannot find module '" + name + "'");
          err.code = 'MODULE_NOT_FOUND';
          throw err;
        }

        var module = cache[id] = {exports: {}};
        modules[id].call(module.exports, require, module, module.exports);
      }

      return cache[id].exports;
    }

    var main = require(entry);
    main.require = require;

    main.register_plugin = function(plugin_modules, plugin_aliases, plugin_entry) {
      for (var name in plugin_modules) {
        modules[name] = plugin_modules[name];
      }

      for (var name in plugin_aliases) {
        aliases[name] = plugin_aliases[name];
      }

      var plugin = require(plugin_entry);

      for (var name in plugin) {
        main[name] = plugin[name];
      }

      return plugin;
    }

    return main;
  })
`

export const plugin_prelude = `\
(function(root, factory) {
//  if(typeof exports === 'object' && typeof module === 'object')
//    factory(require("Bokeh"));
//  else if(typeof define === 'function' && define.amd)
//    define(["Bokeh"], factory);
//  else if(typeof exports === 'object')
//    factory(require("Bokeh"));
//  else
    factory(root["Bokeh"]);
})(this, function(Bokeh) {
  var define;
  return (function(modules, aliases, entry) {
    if (Bokeh != null) {
      return Bokeh.register_plugin(modules, aliases, entry);
    } else {
      throw new Error("Cannot find Bokeh. You have to load it prior to loading plugins.");
    }
  })
`
