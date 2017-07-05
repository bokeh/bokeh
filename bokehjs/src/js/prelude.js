(function outer(modules, cache, entries) {
  var require = function(name) {
    if (!cache[name]) {
      if (!modules[name]) {
        var err = new Error("Cannot find module '" + name + "'");
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      var module = cache[name] = {exports: {}};

      var moduleRequire = function(rel) {
        var dep = modules[name][1][rel];
        return require(dep ? dep : rel);
      }

      modules[name][0].call(module.exports, moduleRequire, module, module.exports);
    }

    return cache[name].exports;
  }

  var main = require(entries[0]);
  main.require = require;

  main.register_plugin = function(plugin_modules, plugin_entry) {
    for (var name in plugin_modules) {
      if (!modules.hasOwnProperty(name))
        modules[name] = plugin_modules[name];
      else
        console.warn("Module '" + name + "' was already registered");
    }

    var plugin = require(plugin_entry);

    for (var name in plugin) {
      main[name] = plugin[name];
    }
  }

  return main;
})
