(function outer(modules, cache, entry) {
  if (typeof Bokeh !== "undefined") {
    for (var name in modules) {
      Bokeh.require.modules[name] = modules[name];
    }

    for (var i = 0; i < entry.length; i++) {
        Bokeh.Models.register_locations(Bokeh.require(entry[i]));
    }
  } else {
    throw new Error("Cannot find Bokeh. You have to load it prior to loading plugins.");
  }
})
