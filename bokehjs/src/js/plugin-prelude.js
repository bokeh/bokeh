(function outer(modules, cache, entry) {
  if (typeof Bokeh !== "undefined") {
    var _ = Bokeh._;

    for (var name in modules) {
      Bokeh.require.modules[name] = modules[name];
    }

    for (var i = 0; i < entry.length; i++) {
        var exports = Bokeh.require(entry[i]);

        if (_.isObject(exports.models)) {
          Bokeh.Models.register_models(exports.models);
        }

        _.extend(Bokeh, _.omit(exports, "models"));
    }
  } else {
    throw new Error("Cannot find Bokeh. You have to load it prior to loading plugins.");
  }
})
