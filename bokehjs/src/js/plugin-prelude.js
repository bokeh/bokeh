(function outer(modules, cache, entry) {
  if (Bokeh) {
    Bokeh.register_modules(modules);

    for (var i = 0; i < entry.length; i++) {
        Bokeh.Collections.register_models(Bokeh.require(entry[i]));
    }
  } else {
    throw new Error("Cannot find Bokeh. You have to load it prior to loading plugins.");
  }
})
