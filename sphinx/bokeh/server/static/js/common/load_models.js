(function() {
  define(["require", "./base", "./logging"], function(require, base, Logging) {
    var load_models, logger;
    logger = Logging.logger;
    return load_models = function(modelspecs) {
      var Collections, attrs, coll, coll_attrs, model, newspecs, oldspecs, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _m;
      newspecs = [];
      oldspecs = [];
      Collections = require("./base").Collections;
      logger.debug("load_models: start");
      for (_i = 0, _len = modelspecs.length; _i < _len; _i++) {
        model = modelspecs[_i];
        coll = Collections(model['type']);
        attrs = model['attributes'];
        if (coll && coll.get(attrs['id'])) {
          oldspecs.push([coll, attrs]);
        } else {
          newspecs.push([coll, attrs]);
        }
      }
      for (_j = 0, _len1 = newspecs.length; _j < _len1; _j++) {
        coll_attrs = newspecs[_j];
        coll = coll_attrs[0], attrs = coll_attrs[1];
        if (coll) {
          coll.add(attrs, {
            'silent': true,
            'defer_initialization': true
          });
        }
      }
      logger.debug("load_models: starting deferred initializations");
      for (_k = 0, _len2 = newspecs.length; _k < _len2; _k++) {
        coll_attrs = newspecs[_k];
        coll = coll_attrs[0], attrs = coll_attrs[1];
        if (coll) {
          coll.get(attrs['id']).initialize(attrs);
        }
      }
      logger.debug("load_models: finished deferred initializations");
      for (_l = 0, _len3 = newspecs.length; _l < _len3; _l++) {
        coll_attrs = newspecs[_l];
        coll = coll_attrs[0], attrs = coll_attrs[1];
        if (coll) {
          model = coll.get(attrs.id);
          model.trigger('add', model, coll, {});
        }
      }
      for (_m = 0, _len4 = oldspecs.length; _m < _len4; _m++) {
        coll_attrs = oldspecs[_m];
        coll = coll_attrs[0], attrs = coll_attrs[1];
        if (coll) {
          coll.get(attrs['id']).set(attrs);
        }
      }
      logger.debug("load_models: finish");
      return null;
    };
  });

}).call(this);

/*
//@ sourceMappingURL=load_models.js.map
*/