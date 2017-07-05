(function(modules, cache, entries) {
  if (Bokeh != null) {
    Bokeh.register_plugin(modules, entries[0]);
  } else {
    throw new Error("Cannot find Bokeh. You have to load it prior to loading plugins.");
  }
})
