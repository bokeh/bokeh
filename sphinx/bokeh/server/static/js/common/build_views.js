(function() {
  define(["underscore"], function(_) {
    var build_views;
    return build_views = function(view_storage, view_models, options, view_types) {
      var created_views, i_model, key, model, newmodels, to_remove, view_specific_option, _i, _j, _len, _len1;
      if (view_types == null) {
        view_types = [];
      }
      created_views = [];
      newmodels = _.filter(view_models, function(x) {
        return !_.has(view_storage, x.id);
      });
      for (i_model = _i = 0, _len = newmodels.length; _i < _len; i_model = ++_i) {
        model = newmodels[i_model];
        view_specific_option = _.extend({}, options, {
          'model': model
        });
        if (i_model < view_types.length) {
          view_storage[model.id] = new view_types[i_model](view_specific_option);
        } else {
          view_storage[model.id] = new model.default_view(view_specific_option);
        }
        created_views.push(view_storage[model.id]);
      }
      to_remove = _.difference(_.keys(view_storage), _.pluck(view_models, 'id'));
      for (_j = 0, _len1 = to_remove.length; _j < _len1; _j++) {
        key = to_remove[_j];
        view_storage[key].remove();
        delete view_storage[key];
      }
      return created_views;
    };
  });

}).call(this);

/*
//@ sourceMappingURL=build_views.js.map
*/