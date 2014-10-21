(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "backbone"], function(_, Backbone) {
    var ContinuumView, _ref;
    return ContinuumView = (function(_super) {
      __extends(ContinuumView, _super);

      function ContinuumView() {
        _ref = ContinuumView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      ContinuumView.prototype.initialize = function(options) {
        if (!_.has(options, 'id')) {
          return this.id = _.uniqueId('ContinuumView');
        }
      };

      ContinuumView.prototype.bind_bokeh_events = function() {
        return 'pass';
      };

      ContinuumView.prototype.delegateEvents = function(events) {
        return ContinuumView.__super__.delegateEvents.call(this, events);
      };

      ContinuumView.prototype.remove = function() {
        var target, val, _ref1;
        if (_.has(this, 'eventers')) {
          _ref1 = this.eventers;
          for (target in _ref1) {
            if (!__hasProp.call(_ref1, target)) continue;
            val = _ref1[target];
            val.off(null, null, this);
          }
        }
        this.trigger('remove', this);
        return ContinuumView.__super__.remove.call(this);
      };

      ContinuumView.prototype.mget = function() {
        return this.model.get.apply(this.model, arguments);
      };

      ContinuumView.prototype.mset = function() {
        return this.model.set.apply(this.model, arguments);
      };

      ContinuumView.prototype.render_end = function() {
        return "pass";
      };

      return ContinuumView;

    })(Backbone.View);
  });

}).call(this);

/*
//@ sourceMappingURL=continuum_view.js.map
*/