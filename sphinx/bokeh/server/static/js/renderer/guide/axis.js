(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "kiwi", "common/has_parent", "common/layout_box", "common/logging", "common/plot_widget", "renderer/properties"], function(_, kiwi, HasParent, LayoutBox, Logging, PlotWidget, properties) {
    var ALPHABETIC, Axis, AxisView, CENTER, HANGING, LEFT, MIDDLE, RIGHT, logger, pi2, _align_lookup, _align_lookup_negative, _align_lookup_positive, _angle_lookup, _apply_location_heuristics, _baseline_lookup, _ref, _ref1;
    logger = Logging.logger;
    pi2 = Math.PI / 2;
    ALPHABETIC = 'alphabetic';
    MIDDLE = 'middle';
    HANGING = 'hanging';
    LEFT = 'left';
    RIGHT = 'right';
    CENTER = 'center';
    _angle_lookup = {
      above: {
        parallel: 0,
        normal: -pi2,
        horizontal: 0,
        vertical: -pi2
      },
      below: {
        parallel: 0,
        normal: pi2,
        horizontal: 0,
        vertical: pi2
      },
      left: {
        parallel: -pi2,
        normal: 0,
        horizontal: 0,
        vertical: -pi2
      },
      right: {
        parallel: pi2,
        normal: 0,
        horizontal: 0,
        vertical: pi2
      }
    };
    _baseline_lookup = {
      above: {
        parallel: ALPHABETIC,
        normal: MIDDLE,
        horizontal: ALPHABETIC,
        vertical: MIDDLE
      },
      below: {
        parallel: HANGING,
        normal: MIDDLE,
        horizontal: HANGING,
        vertical: MIDDLE
      },
      left: {
        parallel: ALPHABETIC,
        normal: MIDDLE,
        horizontal: MIDDLE,
        vertical: ALPHABETIC
      },
      right: {
        parallel: ALPHABETIC,
        normal: MIDDLE,
        horizontal: MIDDLE,
        vertical: ALPHABETIC
      }
    };
    _align_lookup = {
      above: {
        parallel: CENTER,
        normal: LEFT,
        horizontal: CENTER,
        vertical: LEFT
      },
      below: {
        parallel: CENTER,
        normal: LEFT,
        horizontal: CENTER,
        vertical: RIGHT
      },
      left: {
        parallel: CENTER,
        normal: RIGHT,
        horizontal: RIGHT,
        vertical: CENTER
      },
      right: {
        parallel: CENTER,
        normal: LEFT,
        horizontal: LEFT,
        vertical: CENTER
      }
    };
    _align_lookup_negative = {
      above: RIGHT,
      below: LEFT,
      left: RIGHT,
      right: LEFT
    };
    _align_lookup_positive = {
      above: LEFT,
      below: RIGHT,
      left: RIGHT,
      right: LEFT
    };
    _apply_location_heuristics = function(ctx, side, orient) {
      var align, baseline;
      if (_.isString(orient)) {
        baseline = _baseline_lookup[side][orient];
        align = _align_lookup[side][orient];
      } else if (orient === 0) {
        baseline = _baseline_lookup[side][orient];
        align = _align_lookup[side][orient];
      } else if (orient < 0) {
        baseline = 'middle';
        align = _align_lookup_negative[side];
      } else if (orient > 0) {
        baseline = 'middle';
        align = _align_lookup_positive[side];
      }
      ctx.textBaseline = baseline;
      return ctx.textAlign = align;
    };
    AxisView = (function(_super) {
      __extends(AxisView, _super);

      function AxisView() {
        _ref = AxisView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      AxisView.prototype.initialize = function(options) {
        AxisView.__super__.initialize.call(this, options);
        this.rule_props = new properties.Line(this, 'axis_');
        this.major_tick_props = new properties.Line(this, 'major_tick_');
        this.minor_tick_props = new properties.Line(this, 'minor_tick_');
        this.major_label_props = new properties.Text(this, 'major_label_');
        this.axis_label_props = new properties.Text(this, 'axis_label_');
        this.x_range_name = this.mget('x_range_name');
        return this.y_range_name = this.mget('y_range_name');
      };

      AxisView.prototype.render = function() {
        var ctx;
        ctx = this.plot_view.canvas_view.ctx;
        ctx.save();
        this._draw_rule(ctx);
        this._draw_major_ticks(ctx);
        this._draw_minor_ticks(ctx);
        this._draw_major_labels(ctx);
        this._draw_axis_label(ctx);
        return ctx.restore();
      };

      AxisView.prototype.bind_bokeh_events = function() {
        return this.listenTo(this.model, 'change', this.plot_view.request_render);
      };

      AxisView.prototype._draw_rule = function(ctx) {
        var coords, i, nx, ny, sx, sy, x, xoff, y, yoff, _i, _ref1, _ref2, _ref3, _ref4, _ref5;
        if (!this.rule_props.do_stroke) {
          return;
        }
        _ref1 = coords = this.mget('rule_coords'), x = _ref1[0], y = _ref1[1];
        _ref2 = this.plot_view.map_to_screen(x, "data", y, "data", this.x_range_name, this.y_range_name), sx = _ref2[0], sy = _ref2[1];
        _ref3 = this.mget('normals'), nx = _ref3[0], ny = _ref3[1];
        _ref4 = this.mget('offsets'), xoff = _ref4[0], yoff = _ref4[1];
        this.rule_props.set(ctx, this);
        ctx.beginPath();
        ctx.moveTo(Math.round(sx[0] + nx * xoff), Math.round(sy[0] + ny * yoff));
        for (i = _i = 1, _ref5 = sx.length; 1 <= _ref5 ? _i < _ref5 : _i > _ref5; i = 1 <= _ref5 ? ++_i : --_i) {
          ctx.lineTo(Math.round(sx[i] + nx * xoff), Math.round(sy[i] + ny * yoff));
        }
        return ctx.stroke();
      };

      AxisView.prototype._draw_major_ticks = function(ctx) {
        var coords, i, nx, ny, sx, sy, tin, tout, x, xoff, y, yoff, _i, _ref1, _ref2, _ref3, _ref4, _ref5, _results;
        if (!this.major_tick_props.do_stroke) {
          return;
        }
        coords = this.mget('tick_coords');
        _ref1 = coords.major, x = _ref1[0], y = _ref1[1];
        _ref2 = this.plot_view.map_to_screen(x, "data", y, "data", this.x_range_name, this.y_range_name), sx = _ref2[0], sy = _ref2[1];
        _ref3 = this.mget('normals'), nx = _ref3[0], ny = _ref3[1];
        _ref4 = this.mget('offsets'), xoff = _ref4[0], yoff = _ref4[1];
        tin = this.mget('major_tick_in');
        tout = this.mget('major_tick_out');
        this.major_tick_props.set(ctx, this);
        _results = [];
        for (i = _i = 0, _ref5 = sx.length; 0 <= _ref5 ? _i < _ref5 : _i > _ref5; i = 0 <= _ref5 ? ++_i : --_i) {
          ctx.beginPath();
          ctx.moveTo(Math.round(sx[i] + nx * tout + nx * xoff), Math.round(sy[i] + ny * tout + ny * yoff));
          ctx.lineTo(Math.round(sx[i] - nx * tin + nx * xoff), Math.round(sy[i] - ny * tin + ny * yoff));
          _results.push(ctx.stroke());
        }
        return _results;
      };

      AxisView.prototype._draw_minor_ticks = function(ctx) {
        var coords, i, nx, ny, sx, sy, tin, tout, x, xoff, y, yoff, _i, _ref1, _ref2, _ref3, _ref4, _ref5, _results;
        if (!this.minor_tick_props.do_stroke) {
          return;
        }
        coords = this.mget('tick_coords');
        _ref1 = coords.minor, x = _ref1[0], y = _ref1[1];
        _ref2 = this.plot_view.map_to_screen(x, "data", y, "data", this.x_range_name, this.y_range_name), sx = _ref2[0], sy = _ref2[1];
        _ref3 = this.mget('normals'), nx = _ref3[0], ny = _ref3[1];
        _ref4 = this.mget('offsets'), xoff = _ref4[0], yoff = _ref4[1];
        tin = this.mget('minor_tick_in');
        tout = this.mget('minor_tick_out');
        this.minor_tick_props.set(ctx, this);
        _results = [];
        for (i = _i = 0, _ref5 = sx.length; 0 <= _ref5 ? _i < _ref5 : _i > _ref5; i = 0 <= _ref5 ? ++_i : --_i) {
          ctx.beginPath();
          ctx.moveTo(Math.round(sx[i] + nx * tout + nx * xoff), Math.round(sy[i] + ny * tout + ny * yoff));
          ctx.lineTo(Math.round(sx[i] - nx * tin + nx * xoff), Math.round(sy[i] - ny * tin + ny * yoff));
          _results.push(ctx.stroke());
        }
        return _results;
      };

      AxisView.prototype._draw_major_labels = function(ctx) {
        var angle, coords, dim, i, labels, nx, ny, orient, side, standoff, sx, sy, x, xoff, y, yoff, _i, _ref1, _ref2, _ref3, _ref4, _ref5, _results;
        coords = this.mget('tick_coords');
        _ref1 = coords.major, x = _ref1[0], y = _ref1[1];
        _ref2 = this.plot_view.map_to_screen(x, "data", y, "data", this.x_range_name, this.y_range_name), sx = _ref2[0], sy = _ref2[1];
        _ref3 = this.mget('normals'), nx = _ref3[0], ny = _ref3[1];
        _ref4 = this.mget('offsets'), xoff = _ref4[0], yoff = _ref4[1];
        dim = this.mget('dimension');
        side = this.mget('location');
        orient = this.mget('major_label_orientation');
        if (_.isString(orient)) {
          angle = _angle_lookup[side][orient];
        } else {
          angle = -orient;
        }
        standoff = this.model._tick_extent(this) + this.mget('major_label_standoff');
        labels = this.mget('formatter').format(coords.major[dim]);
        this.major_label_props.set(ctx, this);
        _apply_location_heuristics(ctx, side, orient);
        _results = [];
        for (i = _i = 0, _ref5 = sx.length; 0 <= _ref5 ? _i < _ref5 : _i > _ref5; i = 0 <= _ref5 ? ++_i : --_i) {
          if (angle) {
            ctx.translate(sx[i] + nx * standoff + nx * xoff, sy[i] + ny * standoff + ny * yoff);
            ctx.rotate(angle);
            ctx.fillText(labels[i], 0, 0);
            ctx.rotate(-angle);
            _results.push(ctx.translate(-sx[i] - nx * standoff + nx * xoff, -sy[i] - ny * standoff + ny * yoff));
          } else {
            _results.push(ctx.fillText(labels[i], Math.round(sx[i] + nx * standoff + nx * xoff), Math.round(sy[i] + ny * standoff + ny * yoff)));
          }
        }
        return _results;
      };

      AxisView.prototype._draw_axis_label = function(ctx) {
        var angle, label, nx, ny, orient, side, standoff, sx, sy, x, xoff, y, yoff, _ref1, _ref2, _ref3, _ref4;
        label = this.mget('axis_label');
        if (label == null) {
          return;
        }
        _ref1 = this.mget('rule_coords'), x = _ref1[0], y = _ref1[1];
        _ref2 = this.plot_view.map_to_screen(x, "data", y, "data", this.x_range_name, this.y_range_name), sx = _ref2[0], sy = _ref2[1];
        _ref3 = this.mget('normals'), nx = _ref3[0], ny = _ref3[1];
        _ref4 = this.mget('offsets'), xoff = _ref4[0], yoff = _ref4[1];
        side = this.mget('location');
        orient = 'parallel';
        angle = _angle_lookup[side][orient];
        standoff = this.model._tick_extent(this) + this.model._tick_label_extent(this) + this.mget('axis_label_standoff');
        sx = (sx[0] + sx[sx.length - 1]) / 2;
        sy = (sy[0] + sy[sy.length - 1]) / 2;
        this.axis_label_props.set(ctx, this);
        _apply_location_heuristics(ctx, side, orient);
        if (angle) {
          ctx.translate(sx + nx * standoff + nx * xoff, sy + ny * standoff + ny * yoff);
          ctx.rotate(angle);
          ctx.fillText(label, 0, 0);
          ctx.rotate(-angle);
          return ctx.translate(-sx - nx * standoff + nx * xoff, -sy - ny * standoff + ny * yoff);
        } else {
          return ctx.fillText(label, sx + nx * standoff + nx * xoff, sy + ny * standoff + ny * yoff);
        }
      };

      return AxisView;

    })(PlotWidget);
    Axis = (function(_super) {
      __extends(Axis, _super);

      function Axis() {
        _ref1 = Axis.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Axis.prototype.default_view = AxisView;

      Axis.prototype.type = 'Axis';

      Axis.prototype.initialize = function(attrs, options) {
        Axis.__super__.initialize.call(this, attrs, options);
        this.register_property('computed_bounds', this._computed_bounds, false);
        this.add_dependencies('computed_bounds', this, ['bounds']);
        this.add_dependencies('computed_bounds', this.get('plot'), ['x_range', 'y_range']);
        this.register_property('rule_coords', this._rule_coords, false);
        this.add_dependencies('rule_coords', this, ['computed_bounds', 'side']);
        this.register_property('tick_coords', this._tick_coords, false);
        this.add_dependencies('tick_coords', this, ['computed_bounds', 'location']);
        this.register_property('ranges', this._ranges, true);
        this.register_property('normals', (function() {
          return this._normals;
        }), true);
        this.register_property('dimension', (function() {
          return this._dim;
        }), true);
        return this.register_property('offsets', this._offsets, true);
      };

      Axis.prototype.initialize_layout = function(solver) {
        var panel, side;
        panel = new LayoutBox.Model({
          solver: solver
        });
        this.panel = panel;
        this._top = panel._top;
        this._bottom = panel._bottom;
        this._left = panel._left;
        this._right = panel._right;
        this._width = panel._width;
        this._height = panel._height;
        side = this.get('location');
        if (side === "above") {
          this._dim = 0;
          this._normals = [0, -1];
          this._size = panel._height;
          return this._anchor = panel._bottom;
        } else if (side === "below") {
          this._dim = 0;
          this._normals = [0, 1];
          this._size = panel._height;
          return this._anchor = panel._top;
        } else if (side === "left") {
          this._dim = 1;
          this._normals = [-1, 0];
          this._size = panel._width;
          return this._anchor = panel._right;
        } else if (side === "right") {
          this._dim = 1;
          this._normals = [1, 0];
          this._size = panel._width;
          return this._anchor = panel._left;
        } else {
          return logger.error("unrecognized side: '" + side + "'");
        }
      };

      Axis.prototype.update_layout = function(view, solver) {
        var size;
        size = this._tick_extent(view) + this._tick_label_extent(view) + this._axis_label_extent(view);
        if (this._last_size == null) {
          this._last_size = -1;
        }
        if (size === this._last_size) {
          return;
        }
        this._last_size = size;
        if (this._size_constraint != null) {
          solver.remove_constraint(this._size_constraint);
        }
        this._size_constraint = new kiwi.Constraint(new kiwi.Expression(this._size, -size), kiwi.Operator.Eq);
        return solver.add_constraint(this._size_constraint);
      };

      Axis.prototype._offsets = function() {
        var frame, side, xoff, yoff, _ref2;
        side = this.get('location');
        _ref2 = [0, 0], xoff = _ref2[0], yoff = _ref2[1];
        frame = this.get('plot').get('frame');
        if (side === "below") {
          yoff = Math.abs(this.panel.get("top") - frame.get("bottom"));
        } else if (side === "above") {
          yoff = Math.abs(this.panel.get("bottom") - frame.get("top"));
        } else if (side === "right") {
          xoff = Math.abs(this.panel.get("left") - frame.get("right"));
        } else if (side === "left") {
          xoff = Math.abs(this.panel.get("right") - frame.get("left"));
        }
        return [xoff, yoff];
      };

      Axis.prototype._ranges = function() {
        var frame, i, j, ranges;
        i = this.get('dimension');
        j = (i + 1) % 2;
        frame = this.get('plot').get('frame');
        ranges = [frame.get('x_ranges')[this.get('x_range_name')], frame.get('y_ranges')[this.get('y_range_name')]];
        return [ranges[i], ranges[j]];
      };

      Axis.prototype._computed_bounds = function() {
        var cross_range, end, range, range_bounds, start, user_bounds, _ref2, _ref3;
        _ref2 = this.get('ranges'), range = _ref2[0], cross_range = _ref2[1];
        user_bounds = (_ref3 = this.get('bounds')) != null ? _ref3 : 'auto';
        range_bounds = [range.get('min'), range.get('max')];
        if (user_bounds === 'auto') {
          return range_bounds;
        }
        if (_.isArray(user_bounds)) {
          if (Math.abs(user_bounds[0] - user_bounds[1]) > Math.abs(range_bounds[0] - range_bounds[1])) {
            start = Math.max(Math.min(user_bounds[0], user_bounds[1]), range_bounds[0]);
            end = Math.min(Math.max(user_bounds[0], user_bounds[1]), range_bounds[1]);
          } else {
            start = Math.min(user_bounds[0], user_bounds[1]);
            end = Math.max(user_bounds[0], user_bounds[1]);
          }
          return [start, end];
        }
        logger.error("user bounds '" + user_bounds + "' not understood");
        return null;
      };

      Axis.prototype._rule_coords = function() {
        var coords, cross_range, end, i, j, loc, range, start, xs, ys, _ref2, _ref3;
        i = this.get('dimension');
        j = (i + 1) % 2;
        _ref2 = this.get('ranges'), range = _ref2[0], cross_range = _ref2[1];
        _ref3 = this.get('computed_bounds'), start = _ref3[0], end = _ref3[1];
        xs = new Array(2);
        ys = new Array(2);
        coords = [xs, ys];
        loc = this._get_loc(cross_range);
        coords[i][0] = Math.max(start, range.get('min'));
        coords[i][1] = Math.min(end, range.get('max'));
        if (coords[i][0] > coords[i][1]) {
          coords[i][0] = coords[i][1] = NaN;
        }
        coords[j][0] = loc;
        coords[j][1] = loc;
        return coords;
      };

      Axis.prototype._tick_coords = function() {
        var coords, cross_range, end, i, ii, j, loc, majors, minor_coords, minor_xs, minor_ys, minors, range, range_max, range_min, start, ticks, xs, ys, _i, _j, _k, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7;
        i = this.get('dimension');
        j = (i + 1) % 2;
        _ref2 = this.get('ranges'), range = _ref2[0], cross_range = _ref2[1];
        _ref3 = this.get('computed_bounds'), start = _ref3[0], end = _ref3[1];
        ticks = this.get('ticker').get_ticks(start, end, range, {});
        majors = ticks.major;
        minors = ticks.minor;
        loc = this._get_loc(cross_range);
        xs = [];
        ys = [];
        coords = [xs, ys];
        minor_xs = [];
        minor_ys = [];
        minor_coords = [minor_xs, minor_ys];
        if (range.type === "FactorRange") {
          for (ii = _i = 0, _ref4 = majors.length; 0 <= _ref4 ? _i < _ref4 : _i > _ref4; ii = 0 <= _ref4 ? ++_i : --_i) {
            coords[i].push(majors[ii]);
            coords[j].push(loc);
          }
        } else {
          _ref5 = [range.get('min'), range.get('max')], range_min = _ref5[0], range_max = _ref5[1];
          for (ii = _j = 0, _ref6 = majors.length; 0 <= _ref6 ? _j < _ref6 : _j > _ref6; ii = 0 <= _ref6 ? ++_j : --_j) {
            if (majors[ii] < range_min || majors[ii] > range_max) {
              continue;
            }
            coords[i].push(majors[ii]);
            coords[j].push(loc);
          }
          for (ii = _k = 0, _ref7 = minors.length; 0 <= _ref7 ? _k < _ref7 : _k > _ref7; ii = 0 <= _ref7 ? ++_k : --_k) {
            if (minors[ii] < range_min || minors[ii] > range_max) {
              continue;
            }
            minor_coords[i].push(minors[ii]);
            minor_coords[j].push(loc);
          }
        }
        return {
          "major": coords,
          "minor": minor_coords
        };
      };

      Axis.prototype._get_loc = function(cross_range) {
        var cend, cstart, loc, side;
        cstart = cross_range.get('start');
        cend = cross_range.get('end');
        side = this.get('location');
        if (side === 'left' || side === 'below') {
          if (cstart < cend) {
            loc = 'start';
          } else {
            loc = 'end';
          }
        } else if (side === 'right' || side === 'above') {
          if (cstart < cend) {
            loc = 'end';
          } else {
            loc = 'start';
          }
        }
        return cross_range.get(loc);
      };

      Axis.prototype._tick_extent = function(view) {
        return this.get('major_tick_out');
      };

      Axis.prototype._tick_label_extent = function(view) {
        var angle, c, coords, ctx, dim, extent, h, hfactor, hscale, i, labels, orient, s, side, val, w, wfactor, _i, _ref2;
        extent = 0;
        dim = this.get('dimension');
        ctx = view.plot_view.canvas_view.ctx;
        coords = this.get('tick_coords').major;
        side = this.get('location');
        orient = this.get('major_label_orientation');
        labels = this.get('formatter').format(coords[dim]);
        view.major_label_props.set(ctx, view);
        if (_.isString(orient)) {
          hscale = 1;
          angle = _angle_lookup[side][orient];
        } else {
          hscale = 2;
          angle = -orient;
        }
        angle = Math.abs(angle);
        c = Math.cos(angle);
        s = Math.sin(angle);
        if (side === "above" || side === "below") {
          wfactor = s;
          hfactor = c;
        } else {
          wfactor = c;
          hfactor = s;
        }
        for (i = _i = 0, _ref2 = labels.length; 0 <= _ref2 ? _i < _ref2 : _i > _ref2; i = 0 <= _ref2 ? ++_i : --_i) {
          if (labels[i] == null) {
            continue;
          }
          w = ctx.measureText(labels[i]).width * 1.1;
          h = ctx.measureText(labels[i]).ascent * 0.9;
          val = w * wfactor + (h / hscale) * hfactor;
          if (val > extent) {
            extent = val;
          }
        }
        if (extent > 0) {
          extent += this.get('major_label_standoff');
        }
        return extent;
      };

      Axis.prototype._axis_label_extent = function(view) {
        var angle, c, ctx, extent, h, orient, s, side, w;
        extent = 0;
        side = this.get('location');
        orient = 'parallel';
        ctx = view.plot_view.canvas_view.ctx;
        view.axis_label_props.set(ctx, view);
        angle = Math.abs(_angle_lookup[side][orient]);
        c = Math.cos(angle);
        s = Math.sin(angle);
        if (this.get('axis_label')) {
          extent += this.get('axis_label_standoff');
          view.axis_label_props.set(ctx, view);
          w = ctx.measureText(this.get('axis_label')).width * 1.1;
          h = ctx.measureText(this.get('axis_label')).ascent * 0.9;
          if (side === "above" || side === "below") {
            extent += w * s + h * c;
          } else {
            extent += w * c + h * s;
          }
        }
        return extent;
      };

      Axis.prototype.defaults = function() {
        return _.extend({}, Axis.__super__.defaults.call(this), {
          x_range_name: "default",
          y_range_name: "default"
        });
      };

      Axis.prototype.display_defaults = function() {
        return _.extend({}, Axis.__super__.display_defaults.call(this), {
          level: 'overlay',
          axis_line_color: 'black',
          axis_line_width: 1,
          axis_line_alpha: 1.0,
          axis_line_join: 'miter',
          axis_line_cap: 'butt',
          axis_line_dash: [],
          axis_line_dash_offset: 0,
          major_tick_in: 2,
          major_tick_out: 6,
          major_tick_line_color: 'black',
          major_tick_line_width: 1,
          major_tick_line_alpha: 1.0,
          major_tick_line_join: 'miter',
          major_tick_line_cap: 'butt',
          major_tick_line_dash: [],
          major_tick_line_dash_offset: 0,
          minor_tick_in: 0,
          minor_tick_out: 4,
          minor_tick_line_color: 'black',
          minor_tick_line_width: 1,
          minor_tick_line_alpha: 1.0,
          minor_tick_line_join: 'miter',
          minor_tick_line_cap: 'butt',
          minor_tick_line_dash: [],
          minor_tick_line_dash_offset: 0,
          major_label_standoff: 5,
          major_label_orientation: "horizontal",
          major_label_text_font: "helvetica",
          major_label_text_font_size: "10pt",
          major_label_text_font_style: "normal",
          major_label_text_color: "#444444",
          major_label_text_alpha: 1.0,
          major_label_text_align: "center",
          major_label_text_baseline: "alphabetic",
          axis_label: "",
          axis_label_standoff: 5,
          axis_label_text_font: "helvetica",
          axis_label_text_font_size: "16pt",
          axis_label_text_font_style: "normal",
          axis_label_text_color: "#444444",
          axis_label_text_alpha: 1.0,
          axis_label_text_align: "center",
          axis_label_text_baseline: "alphabetic"
        });
      };

      return Axis;

    })(HasParent);
    return {
      "Model": Axis,
      "View": AxisView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=axis.js.map
*/