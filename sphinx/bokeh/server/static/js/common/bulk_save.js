(function() {
  define(["underscore", "jquery", "require", "./base", "./load_models"], function(_, $, require, base, load_models) {
    var bulk_save;
    return bulk_save = function(models) {
      var Config, doc, jsondata, m, url, xhr;
      Config = require("./base").Config;
      doc = models[0].get('doc');
      if (doc == null) {
        throw new Error("Unset 'doc' in " + models[0]);
      }
      jsondata = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = models.length; _i < _len; _i++) {
          m = models[_i];
          _results.push({
            type: m.type,
            attributes: _.clone(m.attributes)
          });
        }
        return _results;
      })();
      jsondata = JSON.stringify(jsondata);
      url = Config.prefix + "bokeh/bb/" + doc + "/bulkupsert";
      xhr = $.ajax({
        type: 'POST',
        url: url,
        contentType: "application/json",
        data: jsondata,
        header: {
          client: "javascript"
        }
      });
      xhr.done(function(data) {
        return load_models(data.modelspecs);
      });
      return xhr;
    };
  });

}).call(this);

/*
//@ sourceMappingURL=bulk_save.js.map
*/