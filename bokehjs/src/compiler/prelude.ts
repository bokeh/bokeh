// TODO import license from "../../../LICENSE.txt"
const license = `\
Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors
All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

Redistributions of source code must retain the above copyright notice,
this list of conditions and the following disclaimer.

Redistributions in binary form must reproduce the above copyright notice,
this list of conditions and the following disclaimer in the documentation
and/or other materials provided with the distribution.

Neither the name of Anaconda nor the names of any contributors
may be used to endorse or promote products derived from this software
without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
THE POSSIBILITY OF SUCH DAMAGE.
`

function comment(text: string): string {
  return `/*!${"\n"}${text.trim().split("\n").map((line) => ` * ${line}`).join("\n")}${"\n"}*/`
}

function str(obj: unknown): string {
  return JSON.stringify(obj)
}

export function prelude(): string {
  return `\
${comment(license)}
(function(root, factory) {
  const bokeh = factory();
  bokeh.__bokeh__ = true;
  if (typeof root.Bokeh === "undefined" || typeof root.Bokeh.__bokeh__ === "undefined") {
    root.Bokeh = bokeh;
  }
  const Bokeh = root.Bokeh;
  Bokeh[bokeh.version] = bokeh;
})(this, function() {
  var define;
  var parent_require = typeof require === "function" && require
  return (function(modules, entry, aliases, externals) {
    if (aliases === undefined) aliases = {};
    if (externals === undefined) externals = {};

    var cache = {};

    var normalize = function(name) {
      if (typeof name === "number")
        return name;

      if (name === "bokehjs")
        return entry;

      var prefix = "@bokehjs/"
      if (name.slice(0, prefix.length) === prefix)
        name = name.slice(prefix.length)

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
            if (externals[id] === false || (externals[id] == true && parent_require)) {
              try {
                mod = {exports: externals[id] ? parent_require(id) : {}};
                cache[id] = cache[name] = mod;
                return mod.exports;
              } catch (e) {}
            }

            var err = new Error("Cannot find module '" + name + "'");
            err.code = 'MODULE_NOT_FOUND';
            throw err;
          }

          mod = {exports: {}};
          cache[id] = cache[name] = mod;
          modules[id].call(mod.exports, require, mod, mod.exports);
        } else
          cache[name] = mod;
      }

      return mod.exports;
    }
    require.resolve = function(name) {
      return ""
    }

    var main = require(entry);
    main.require = require;

    if (typeof Proxy !== "undefined") {
      // allow Bokeh.loader["@bokehjs/module/name"] syntax
      main.loader = new Proxy({}, {
        get: function(_obj, module) {
          return require(module);
        }
      });
    }

    main.register_plugin = function(plugin_modules, plugin_entry, plugin_aliases, plugin_externals) {
      if (plugin_aliases === undefined) plugin_aliases = {};
      if (plugin_externals === undefined) plugin_externals = {};

      for (var name in plugin_modules) {
        modules[name] = plugin_modules[name];
      }

      for (var name in plugin_aliases) {
        aliases[name] = plugin_aliases[name];
      }

      for (var name in plugin_externals) {
        externals[name] = plugin_externals[name];
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
}

export function plugin_prelude(options?: {version?: string}): string {
  return `\
${comment(license)}
(function(root, factory) {
  factory(root["Bokeh"], ${str(options?.version)});
})(this, function(Bokeh, version) {
  var define;
  return (function(modules, entry, aliases, externals) {
    const bokeh = typeof Bokeh !== "undefined" && (version != null ? Bokeh[version] : Bokeh);
    if (bokeh != null) {
      return bokeh.register_plugin(modules, entry, aliases);
    } else {
      throw new Error("Cannot find Bokeh " + version + ". You have to load it prior to loading plugins.");
    }
  })
`
}

export function default_prelude(options?: {global?: string}): string {
  return `\
(function(root, factory) {
  ${options?.global != null ? `root[${str(options.global)}] = factory()` : "Object.assign(root, factory())"};
})(this, function() {
  var parent_require = typeof require === "function" && require
  return (function(modules, entry, aliases, externals) {
    if (aliases === undefined) aliases = {};
    if (externals === undefined) externals = {};

    var cache = {};

    var normalize = function(name) {
      var alias = aliases[name];
      return alias != null ? alias : name;
    }

    var require = function(name) {
      var mod = cache[name];
      if (!mod) {
        var id = normalize(name);

        mod = cache[id];
        if (!mod) {
          if (!modules[id]) {
            if (externals[id] === false || (externals[id] == true && parent_require)) {
              try {
                mod = {exports: externals[id] ? parent_require(id) : {}};
                cache[id] = cache[name] = mod;
                return mod.exports;
              } catch (e) {}
            }

            var err = new Error("Cannot find module '" + name + "'");
            err.code = 'MODULE_NOT_FOUND';
            throw err;
          }

          mod = {exports: {}};
          cache[id] = cache[name] = mod;
          modules[id].call(mod.exports, require, mod, mod.exports);
        } else
          cache[name] = mod;
      }

      return mod.exports;
    }
    require.resolve = function(name) {
      return ""
    }

    var main = require(entry);
    return main;
  })
`
}
