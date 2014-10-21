(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "./collection", "./layout_box", "./logging", "mapper/linear_mapper", "mapper/log_mapper", "mapper/categorical_mapper", "mapper/grid_mapper"], function(_, Collection, LayoutBox, Logging, LinearMapper, LogMapper, CategoricalMapper, GridMapper) {
    var CartesianFrame, CartesianFrames, logger, _ref, _ref1;
    logger = Logging.logger;
    CartesianFrame = (function(_super) {
      __extends(CartesianFrame, _super);

      function CartesianFrame() {
        _ref = CartesianFrame.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      CartesianFrame.prototype.type = 'CartesianFrame';

      CartesianFrame.prototype.initialize = function(attrs, options) {
        CartesianFrame.__super__.initialize.call(this, attrs, options);
        this.register_property('x_ranges', function() {
          return this._get_ranges('x');
        }, true);
        this.add_dependencies('x_ranges', this, ['x_range', 'extra_x_ranges']);
        this.register_property('y_ranges', function() {
          return this._get_ranges('y');
        }, true);
        this.add_dependencies('y_ranges', this, ['y_range', 'extra_y_ranges']);
        this.register_property('x_mappers', function() {
          return this._get_mappers('x', this.get('x_ranges'), this.get('h_range'));
        }, true);
        this.add_dependencies('x_ranges', this, ['x_ranges', 'h_range']);
        this.register_property('y_mappers', function() {
          return this._get_mappers('y', this.get('y_ranges'), this.get('v_range'));
        }, true);
        this.add_dependencies('y_ranges', this, ['y_ranges', 'v_range']);
        this.register_property('mapper', function() {
          return new GridMapper.Model({
            domain_mapper: this.get('x_mapper'),
            codomain_mapper: this.get('y_mapper')
          });
        }, true);
        this.add_dependencies('mapper', this, ['x_mapper', 'y_mapper']);
        return this.listenTo(this.solver, 'layout_update', this._update_mappers);
      };

      CartesianFrame.prototype.map_to_screen = function(x, x_units, y, y_units, canvas, x_name, y_name) {
        var sx, sy, vx, vy;
        if (x_name == null) {
          x_name = 'default';
        }
        if (y_name == null) {
          y_name = 'default';
        }
        if (x_units === 'screen') {
          if (_.isArray(x)) {
            vx = x.slice(0);
          } else {
            vx = new Float64Array(x.length);
            vx.set(x);
          }
        } else {
          vx = this.get('x_mappers')[x_name].v_map_to_target(x);
        }
        if (y_units === 'screen') {
          if (_.isArray(y)) {
            vy = y.slice(0);
          } else {
            vy = new Float64Array(y.length);
            vy.set(y);
          }
        } else {
          vy = this.get('y_mappers')[y_name].v_map_to_target(y);
        }
        sx = canvas.v_vx_to_sx(vx);
        sy = canvas.v_vy_to_sy(vy);
        return [sx, sy];
      };

      CartesianFrame.prototype.map_from_screen = function(sx, sy, units, canvas) {
        var dx, dy, x, y, _ref1;
        if (_.isArray(sx)) {
          dx = sx.slice(0);
        } else {
          dx = new Float64Array(sx.length);
          dx.set(sx);
        }
        if (_.isArray(sy)) {
          dy = sy.slice(0);
        } else {
          dy = new Float64Array(sy.length);
          dy.set(sy);
        }
        sx = canvas.v_sx_to_vx(dx);
        sy = canvas.v_sy_to_vy(dy);
        if (units === 'screen') {
          x = sx;
          y = sy;
        } else {
          _ref1 = this.mapper.v_map_from_target(sx, sy), x = _ref1[0], y = _ref1[1];
        }
        return [x, y];
      };

      CartesianFrame.prototype._get_ranges = function(dim) {
        var extra_ranges, name, range, ranges;
        ranges = {};
        ranges['default'] = this.get("" + dim + "_range");
        extra_ranges = this.get("extra_" + dim + "_ranges");
        if (extra_ranges != null) {
          for (name in extra_ranges) {
            range = extra_ranges[name];
            ranges[name] = this.resolve_ref(range);
          }
        }
        return ranges;
      };

      CartesianFrame.prototype._get_mappers = function(dim, ranges, frame_range) {
        var mapper_type, mappers, name, range;
        mappers = {};
        for (name in ranges) {
          range = ranges[name];
          if (range.type === "Range1d" || range.type === "DataRange1d") {
            if (this.get("" + dim + "_mapper_type") === "log") {
              mapper_type = LogMapper.Model;
            } else {
              mapper_type = LinearMapper.Model;
            }
          } else if (range.type === "FactorRange") {
            mapper_type = CategoricalMapper.Model;
          } else {
            logger.warn("unknown range type for range '" + name + "': " + range);
            return null;
          }
          mappers[name] = new mapper_type({
            source_range: range,
            target_range: frame_range
          });
        }
        return mappers;
      };

      CartesianFrame.prototype._update_mappers = function() {
        var mapper, name, _ref1, _ref2, _results;
        _ref1 = this.get('x_mappers');
        for (name in _ref1) {
          mapper = _ref1[name];
          mapper.set('target_range', this.get('h_range'));
        }
        _ref2 = this.get('y_mappers');
        _results = [];
        for (name in _ref2) {
          mapper = _ref2[name];
          _results.push(mapper.set('target_range', this.get('v_range')));
        }
        return _results;
      };

      CartesianFrame.prototype.defaults = function() {
        return _.extend({}, CartesianFrame.__super__.defaults.call(this), {
          extra_x_ranges: {},
          extra_y_ranges: {}
        });
      };

      return CartesianFrame;

    })(LayoutBox.Model);
    CartesianFrames = (function(_super) {
      __extends(CartesianFrames, _super);

      function CartesianFrames() {
        _ref1 = CartesianFrames.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      CartesianFrames.prototype.model = CartesianFrame;

      return CartesianFrames;

    })(Collection);
    return {
      "Model": CartesianFrame,
      "Collection": new CartesianFrames()
    };
  });

}).call(this);

/*
//@ sourceMappingURL=cartesian_frame.js.map
*/