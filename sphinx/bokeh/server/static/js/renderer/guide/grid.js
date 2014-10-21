(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "common/has_parent", "common/collection", "renderer/properties", "common/plot_widget"], function(_, HasParent, Collection, properties, PlotWidget) {
    var Grid, GridView, Grids, _ref, _ref1, _ref2;
    GridView = (function(_super) {
      __extends(GridView, _super);

      function GridView() {
        _ref = GridView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      GridView.prototype.initialize = function(attrs, options) {
        GridView.__super__.initialize.call(this, attrs, options);
        this.grid_props = new properties.Line(this, 'grid_');
        this.x_range_name = this.mget('x_range_name');
        return this.y_range_name = this.mget('y_range_name');
      };

      GridView.prototype.render = function() {
        var ctx;
        ctx = this.plot_view.canvas_view.ctx;
        ctx.save();
        this._draw_grids(ctx);
        return ctx.restore();
      };

      GridView.prototype.bind_bokeh_events = function() {
        return this.listenTo(this.model, 'change', this.request_render);
      };

      GridView.prototype._draw_grids = function(ctx) {
        var i, sx, sy, xs, ys, _i, _j, _ref1, _ref2, _ref3, _ref4;
        if (!this.grid_props.do_stroke) {
          return;
        }
        _ref1 = this.mget('grid_coords'), xs = _ref1[0], ys = _ref1[1];
        this.grid_props.set(ctx, this);
        for (i = _i = 0, _ref2 = xs.length; 0 <= _ref2 ? _i < _ref2 : _i > _ref2; i = 0 <= _ref2 ? ++_i : --_i) {
          _ref3 = this.plot_view.map_to_screen(xs[i], "data", ys[i], "data", this.x_range_name, this.y_range_name), sx = _ref3[0], sy = _ref3[1];
          ctx.beginPath();
          ctx.moveTo(Math.round(sx[0]), Math.round(sy[0]));
          for (i = _j = 1, _ref4 = sx.length; 1 <= _ref4 ? _j < _ref4 : _j > _ref4; i = 1 <= _ref4 ? ++_j : --_j) {
            ctx.lineTo(Math.round(sx[i]), Math.round(sy[i]));
          }
          ctx.stroke();
        }
      };

      return GridView;

    })(PlotWidget);
    Grid = (function(_super) {
      __extends(Grid, _super);

      function Grid() {
        _ref1 = Grid.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Grid.prototype.default_view = GridView;

      Grid.prototype.type = 'Grid';

      Grid.prototype.initialize = function(attrs, options) {
        Grid.__super__.initialize.call(this, attrs, options);
        this.register_property('computed_bounds', this._bounds, false);
        this.add_dependencies('computed_bounds', this, ['bounds']);
        this.register_property('grid_coords', this._grid_coords, false);
        this.add_dependencies('grid_coords', this, ['computed_bounds', 'dimension', 'ticker']);
        return this.register_property('ranges', this._ranges, true);
      };

      Grid.prototype._ranges = function() {
        var frame, i, j, ranges;
        i = this.get('dimension');
        j = (i + 1) % 2;
        frame = this.get('plot').get('frame');
        ranges = [frame.get('x_ranges')[this.get('x_range_name')], frame.get('y_ranges')[this.get('y_range_name')]];
        return [ranges[i], ranges[j]];
      };

      Grid.prototype._bounds = function() {
        var cross_range, end, range, range_bounds, start, user_bounds, _ref2, _ref3;
        _ref2 = this.get('ranges'), range = _ref2[0], cross_range = _ref2[1];
        user_bounds = (_ref3 = this.get('bounds')) != null ? _ref3 : 'auto';
        range_bounds = [range.get('min'), range.get('max')];
        if (_.isArray(user_bounds)) {
          start = Math.min(user_bounds[0], user_bounds[1]);
          end = Math.max(user_bounds[0], user_bounds[1]);
          if (start < range_bounds[0]) {
            start = range_bounds[0];
          } else if (start > range_bounds[1]) {
            start = null;
          }
          if (end > range_bounds[1]) {
            end = range_bounds[1];
          } else if (end < range_bounds[0]) {
            end = null;
          }
        } else {
          start = range_bounds[0], end = range_bounds[1];
        }
        return [start, end];
      };

      Grid.prototype._grid_coords = function() {
        var N, cmax, cmin, coords, cross_range, dim_i, dim_j, end, i, ii, j, loc, max, min, n, range, start, ticks, tmp, _i, _j, _ref2, _ref3, _ref4;
        i = this.get('dimension');
        j = (i + 1) % 2;
        _ref2 = this.get('ranges'), range = _ref2[0], cross_range = _ref2[1];
        _ref3 = this.get('computed_bounds'), start = _ref3[0], end = _ref3[1];
        tmp = Math.min(start, end);
        end = Math.max(start, end);
        start = tmp;
        ticks = this.get('ticker').get_ticks(start, end, range, {}).major;
        min = range.get('min');
        max = range.get('max');
        cmin = cross_range.get('min');
        cmax = cross_range.get('max');
        coords = [[], []];
        for (ii = _i = 0, _ref4 = ticks.length; 0 <= _ref4 ? _i < _ref4 : _i > _ref4; ii = 0 <= _ref4 ? ++_i : --_i) {
          if (ticks[ii] === min || ticks[ii] === max) {
            continue;
          }
          dim_i = [];
          dim_j = [];
          N = 2;
          for (n = _j = 0; 0 <= N ? _j < N : _j > N; n = 0 <= N ? ++_j : --_j) {
            loc = cmin + (cmax - cmin) / (N - 1) * n;
            dim_i.push(ticks[ii]);
            dim_j.push(loc);
          }
          coords[i].push(dim_i);
          coords[j].push(dim_j);
        }
        return coords;
      };

      Grid.prototype.defaults = function() {
        return _.extend({}, Grid.__super__.defaults.call(this), {
          x_range_name: "default",
          y_range_name: "default"
        });
      };

      Grid.prototype.display_defaults = function() {
        return _.extend({}, Grid.__super__.display_defaults.call(this), {
          level: 'underlay',
          grid_line_color: '#cccccc',
          grid_line_width: 1,
          grid_line_alpha: 1.0,
          grid_line_join: 'miter',
          grid_line_cap: 'butt',
          grid_line_dash: [],
          grid_line_dash_offset: 0
        });
      };

      return Grid;

    })(HasParent);
    Grids = (function(_super) {
      __extends(Grids, _super);

      function Grids() {
        _ref2 = Grids.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      Grids.prototype.model = Grid;

      return Grids;

    })(Collection);
    return {
      "Model": Grid,
      "Collection": new Grids(),
      "View": GridView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=grid.js.map
*/