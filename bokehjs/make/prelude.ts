import * as fs from "fs"

const license = fs.readFileSync('../LICENSE.txt', 'utf-8')
                  .trim().split("\n").map((line) => ` * ${line}`).join("\n")

export const prelude = `\
/*!
${license}
 */
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
  return (function(modules, aliases, entry, parent_require) {
    var cache = {};

    var normalize = function(name) {
      if (typeof name === "number")
        return name;

      if (name === "bokehjs")
        return entry;

      var alias = aliases[name]
      if (alias != null)
        return alias;

      var trailing = name.length > 0 && name[name.lenght-1] === "/";
      var index = aliases[name + (trailing ? "" : "/") + "index"];
      if (index != null)
        return index;

      return name;
    }

    var require = function(name) {
      var mod = cache[name];
      if (!mod) {
        var id = normalize(name);

        mod = cache[id];
        if (!mod) {
          if (!modules[id]) {
            if (parent_require)
              return parent_require(id);

            var err = new Error("Cannot find module '" + name + "'");
            err.code = 'MODULE_NOT_FOUND';
            throw err;
          }

          mod = {exports: {}};
          cache[id] = mod;
          cache[name] = mod;
          modules[id].call(mod.exports, require, mod, mod.exports);
        } else
          cache[name] = mod;
      }

      return mod.exports;
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
/*!
${license}
 */
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
