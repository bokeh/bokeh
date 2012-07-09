var Continuum, ContinuumView, DeferredParent, DeferredView, build_views, safebind,
  __hasProp = Object.prototype.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

if (this.Continuum) {
  Continuum = this.Continuum;
} else {
  Continuum = {};
  this.Continuum = Continuum;
}

safebind = function(binder, target, event, callback) {
  var _this = this;
  if (!_.has(binder, 'eventers')) binder['eventers'] = {};
  binder['eventers'][target.id] = target;
  target.on(event, callback, binder);
  target.on('destroy remove', function() {
    return delete binder['eventers'][target];
  }, binder);
  return null;
};

Continuum.safebind = safebind;

build_views = function(mainmodel, view_storage, view_specs, options, view_options) {
  "use strict";
  var created_views, idx, key, model, spec, temp, valid_viewmodels, value, view_specific_option, _i, _len, _len2;
  created_views = [];
  valid_viewmodels = {};
  for (_i = 0, _len = view_specs.length; _i < _len; _i++) {
    spec = view_specs[_i];
    valid_viewmodels[spec.id] = true;
  }
  for (idx = 0, _len2 = view_specs.length; idx < _len2; idx++) {
    spec = view_specs[idx];
    if (view_storage[spec.id]) continue;
    model = mainmodel.resolve_ref(spec);
    if (view_options) {
      view_specific_option = view_options[idx];
    } else {
      view_specific_option = {};
    }
    temp = _.extend({}, view_specific_option, spec.options, options, {
      'model': model
    });
    view_storage[model.id] = new model.default_view(temp);
    created_views.push(view_storage[model.id]);
  }
  for (key in view_storage) {
    if (!__hasProp.call(view_storage, key)) continue;
    value = view_storage[key];
    if (!valid_viewmodels[key]) {
      value.remove();
      delete view_storage[key];
    }
  }
  return created_views;
};

Continuum.build_views = build_views;

ContinuumView = (function(_super) {

  __extends(ContinuumView, _super);

  function ContinuumView() {
    ContinuumView.__super__.constructor.apply(this, arguments);
  }

  ContinuumView.prototype.initialize = function(options) {
    if (!_.has(options, 'id')) return this.id = _.uniqueId('ContinuumView');
  };

  ContinuumView.prototype.remove = function() {
    var target, val, _ref;
    if (_.has(this, 'eventers')) {
      _ref = this.eventers;
      for (target in _ref) {
        if (!__hasProp.call(_ref, target)) continue;
        val = _ref[target];
        val.off(null, null, this);
      }
    }
    this.trigger('remove');
    return ContinuumView.__super__.remove.call(this);
  };

  ContinuumView.prototype.tag_selector = function(tag, id) {
    return "#" + this.tag_id(tag, id);
  };

  ContinuumView.prototype.tag_id = function(tag, id) {
    if (!id) id = this.id;
    return tag + "-" + id;
  };

  ContinuumView.prototype.tag_el = function(tag, id) {
    return this.$el.find("#" + this.tag_id(tag, id));
  };

  ContinuumView.prototype.tag_d3 = function(tag, id) {
    var val;
    val = d3.select(this.el).select("#" + this.tag_id(tag, id));
    if (val[0][0] === null) {
      return null;
    } else {
      return val;
    }
  };

  ContinuumView.prototype.mget = function() {
    return this.model.get.apply(this.model, arguments);
  };

  ContinuumView.prototype.mset = function() {
    return this.model.set.apply(this.model, arguments);
  };

  ContinuumView.prototype.mget_ref = function(fld) {
    return this.model.get_ref(fld);
  };

  ContinuumView.prototype.add_dialog = function() {
    var position,
      _this = this;
    position = function() {
      return _this.$el.dialog('widget').css({
        'top': _this.model.position_y() + "px",
        'left': _this.model.position_x() + "px"
      });
    };
    this.$el.dialog({
      width: this.mget('outerwidth') + 50,
      maxHeight: $(window).height(),
      close: function() {
        return _this.remove();
      },
      dragStop: function(event, ui) {
        var left, top, xoff, yoff;
        top = parseInt(_this.$el.dialog('widget').css('top').split('px')[0]);
        left = parseInt(_this.$el.dialog('widget').css('left').split('px')[0]);
        xoff = _this.model.reverse_position_x(left);
        yoff = _this.model.reverse_position_y(top);
        _this.model.set({
          'offset': [xoff, yoff]
        });
        return _this.model.save();
      }
    });
    position();
    _.defer(function() {
      return _this.$el.dialog('option', 'height', _this.mget('outerheight') + 70);
    });
    safebind(this, this.model, 'change:offset', position);
    safebind(this, this.model, 'change:outerwidth', function() {
      return this.$el.dialog('option', 'width', this.mget('outerwidth'));
    });
    return safebind(this, this.model, 'change:outerheight', function() {
      return this.$el.dialog('option', 'height', this.mget('outerheight'));
    });
  };

  return ContinuumView;

})(Backbone.View);

DeferredView = (function(_super) {

  __extends(DeferredView, _super);

  function DeferredView() {
    DeferredView.__super__.constructor.apply(this, arguments);
  }

  DeferredView.prototype.initialize = function(options) {
    this.deferred_parent = options['deferred_parent'];
    this.request_render();
    return DeferredView.__super__.initialize.call(this, options);
  };

  DeferredView.prototype.render = function() {
    DeferredView.__super__.render.call(this);
    this._dirty = false;
    return DeferredView.__super__.render.call(this);
  };

  DeferredView.prototype.request_render = function() {
    return this._dirty = true;
  };

  DeferredView.prototype.render_deferred_components = function(force) {
    if (force || this._dirty) return this.render();
  };

  return DeferredView;

})(ContinuumView);

DeferredParent = (function(_super) {

  __extends(DeferredParent, _super);

  function DeferredParent() {
    DeferredParent.__super__.constructor.apply(this, arguments);
  }

  DeferredParent.prototype.initialize = function(options) {
    var _this = this;
    DeferredParent.__super__.initialize.call(this, options);
    if (this.mget('render_loop')) {
      console.log('loop');
      _.defer(function() {
        return _this.render_loop();
      });
    }
    return safebind(this, this.model, 'change:render_loop', function() {
      if (_this.mget('render_loop') && !_this.looping) return _this.render_loop();
    });
  };

  DeferredParent.prototype.render_loop = function() {
    var _this = this;
    this.looping = true;
    this.render_deferred_components();
    if (!this.removed && this.mget('render_loop')) {
      return setTimeout((function() {
        return _this.render_loop();
      }), 100);
    } else {
      return this.looping = false;
    }
  };

  DeferredParent.prototype.remove = function() {
    DeferredParent.__super__.remove.call(this);
    return this.removed = true;
  };

  return DeferredParent;

})(DeferredView);

Continuum.DeferredView = DeferredView;

Continuum.DeferredParent = DeferredParent;
