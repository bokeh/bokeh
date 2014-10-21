(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "common/collection", "common/has_properties"], function(_, Collection, HasProperties) {
    var Range1d, Range1ds, _ref, _ref1;
    Range1d = (function(_super) {
      __extends(Range1d, _super);

      function Range1d() {
        _ref = Range1d.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      Range1d.prototype.type = 'Range1d';

      Range1d.prototype.initialize = function(attrs, options) {
        Range1d.__super__.initialize.call(this, attrs, options);
        this.register_property('min', function() {
          return Math.min(this.get('start'), this.get('end'));
        }, true);
        this.add_dependencies('min', this, ['start', 'end']);
        this.register_property('max', function() {
          return Math.max(this.get('start'), this.get('end'));
        }, true);
        return this.add_dependencies('max', this, ['start', 'end']);
      };

      Range1d.prototype.defaults = function() {
        return _.extend({}, Range1d.__super__.defaults.call(this), {
          start: 0,
          end: 1
        });
      };

      return Range1d;

    })(HasProperties);
    Range1ds = (function(_super) {
      __extends(Range1ds, _super);

      function Range1ds() {
        _ref1 = Range1ds.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Range1ds.prototype.model = Range1d;

      return Range1ds;

    })(Collection);
    return {
      "Model": Range1d,
      "Collection": new Range1ds()
    };
  });

}).call(this);

/*
//@ sourceMappingURL=range1d.js.map
*/