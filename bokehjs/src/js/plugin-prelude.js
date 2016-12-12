(function outer(modules, cache, entry) {
  if (Bokeh != null) {
    for (var name in modules) {
      Bokeh.require.modules[name] = modules[name];
    }

    for (var i = 0; i < entry.length; i++) {
      var plugin = Bokeh.require(entry[0]);
      Bokeh.Models.register_models(plugin.models);

      for (var name in plugin) {
        if (name !== "models") {
          Bokeh[name] = plugin[name];
        }
      }
    }
  } else {
    throw new Error("Cannot find Bokeh. You have to load it prior to loading plugins.");
  }
})
