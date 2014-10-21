(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "backbone", "kiwi", "./build_views", "./canvas", "./cartesian_frame", "./continuum_view", "./collection", "./events", "./has_parent", "./layout_box", "./logging", "./plot_utils", "./solver", "./tool_manager", "./plot_template", "renderer/properties"], function(_, Backbone, kiwi, build_views, Canvas, CartesianFrame, ContinuumView, Collection, Events, HasParent, LayoutBox, Logging, plot_utils, Solver, ToolManager, plot_template, properties) {
    var Constraint, EQ, Expr, GE, LE, Plot, PlotView, Plots, logger, _ref, _ref1, _ref2;
    Expr = kiwi.Expression;
    Constraint = kiwi.Constraint;
    EQ = kiwi.Operator.Eq;
    LE = kiwi.Operator.Le;
    GE = kiwi.Operator.Ge;
    logger = Logging.logger;
    PlotView = (function(_super) {
      __extends(PlotView, _super);

      function PlotView() {
        _ref = PlotView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      PlotView.prototype.className = "bk-plot";

      PlotView.prototype.template = plot_template;

      PlotView.prototype.view_options = function() {
        return _.extend({
          plot_model: this.model,
          plot_view: this
        }, this.options);
      };

      PlotView.prototype.pause = function() {
        return this.is_paused = true;
      };

      PlotView.prototype.unpause = function() {
        this.is_paused = false;
        return this.request_render();
      };

      PlotView.prototype.request_render = function() {
        if (!this.is_paused) {
          this.throttled_render(true);
        }
      };

      PlotView.prototype.initialize = function(options) {
        var id, level, tool_view, _i, _len, _ref1, _ref2;
        PlotView.__super__.initialize.call(this, options);
        this.pause();
        this.model.initialize_layout(this.model.solver);
        this.frame = this.mget('frame');
        this.x_range = this.frame.get('x_ranges')['default'];
        this.y_range = this.frame.get('y_ranges')['default'];
        this.xmapper = this.frame.get('x_mappers')['default'];
        this.ymapper = this.frame.get('y_mappers')['default'];
        this.$el.html(this.template());
        this.canvas = this.mget('canvas');
        this.canvas_view = new this.canvas.default_view({
          'model': this.canvas
        });
        this.$('.bk-plot-canvas-wrapper').append(this.canvas_view.el);
        this.canvas_view.render();
        this.throttled_render = plot_utils.throttle_animation(this.render, 15);
        this.outline_props = new properties.Line(this, 'outline_');
        this.title_props = new properties.Text(this, 'title_');
        this.renderers = {};
        this.tools = {};
        this.levels = {};
        _ref1 = plot_utils.LEVELS;
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          level = _ref1[_i];
          this.levels[level] = {};
        }
        this.build_levels();
        this.bind_bokeh_events();
        this.model.add_constraints(this.canvas.solver);
        this.listenTo(this.canvas.solver, 'layout_update', this.request_render);
        this.event_bus = new Events({
          tool_manager: this.mget('tool_manager'),
          hit_area: this.canvas_view.$el
        });
        _ref2 = this.tools;
        for (id in _ref2) {
          tool_view = _ref2[id];
          this.event_bus.register_tool(tool_view);
        }
        this.unpause();
        this.request_render();
        logger.debug("PlotView initialized");
        return this;
      };

      PlotView.prototype.map_to_screen = function(x, x_units, y, y_units, x_name, y_name) {
        if (x_name == null) {
          x_name = 'default';
        }
        if (y_name == null) {
          y_name = 'default';
        }
        return this.frame.map_to_screen(x, x_units, y, y_units, this.canvas, x_name, y_name);
      };

      PlotView.prototype.map_from_screen = function(sx, sy, units) {
        return this.frame.map_from_screen(sx, sy, units, this.canvas, name);
      };

      PlotView.prototype.update_range = function(range_info) {
        var name, rng, _ref1, _ref2;
        if (range_info == null) {
          range_info = this.initial_range_info;
        }
        this.pause();
        _ref1 = this.frame.get('x_ranges');
        for (name in _ref1) {
          rng = _ref1[name];
          rng.set(range_info.xrs[name]);
        }
        _ref2 = this.frame.get('y_ranges');
        for (name in _ref2) {
          rng = _ref2[name];
          rng.set(range_info.yrs[name]);
        }
        return this.unpause();
      };

      PlotView.prototype.build_levels = function() {
        var id_, level, old_renderers, renderers_to_remove, t, tools, v, views, _i, _j, _k, _len, _len1, _len2;
        old_renderers = _.keys(this.renderers);
        views = build_views(this.renderers, this.mget('renderers'), this.view_options());
        renderers_to_remove = _.difference(old_renderers, _.pluck(this.mget('renderers'), 'id'));
        for (_i = 0, _len = renderers_to_remove.length; _i < _len; _i++) {
          id_ = renderers_to_remove[_i];
          delete this.levels.glyph[id_];
        }
        tools = build_views(this.tools, this.mget('tools'), this.view_options());
        for (_j = 0, _len1 = views.length; _j < _len1; _j++) {
          v = views[_j];
          level = v.mget('level');
          this.levels[level][v.model.id] = v;
          v.bind_bokeh_events();
        }
        for (_k = 0, _len2 = tools.length; _k < _len2; _k++) {
          t = tools[_k];
          level = t.mget('level');
          this.levels[level][t.model.id] = t;
          t.bind_bokeh_events();
        }
        return this;
      };

      PlotView.prototype.bind_bokeh_events = function() {
        var name, rng, _ref1, _ref2,
          _this = this;
        _ref1 = this.mget('frame').get('x_ranges');
        for (name in _ref1) {
          rng = _ref1[name];
          this.listenTo(rng, 'change', this.request_render);
        }
        _ref2 = this.mget('frame').get('y_ranges');
        for (name in _ref2) {
          rng = _ref2[name];
          this.listenTo(rng, 'change', this.request_render);
        }
        this.listenTo(this.model, 'change:renderers', this.build_levels);
        this.listenTo(this.model, 'change:tool', this.build_levels);
        this.listenTo(this.model, 'change', this.request_render);
        return this.listenTo(this.model, 'destroy', function() {
          return _this.remove();
        });
      };

      PlotView.prototype.set_initial_range = function() {
        var good_vals, name, rng, xrs, yrs, _ref1, _ref2;
        good_vals = true;
        xrs = {};
        _ref1 = this.frame.get('x_ranges');
        for (name in _ref1) {
          rng = _ref1[name];
          if ((rng.get('start') == null) || (rng.get('end') == null) || _.isNaN(rng.get('start') + rng.get('end'))) {
            good_vals = false;
            break;
          }
          xrs[name] = {
            start: rng.get('start'),
            end: rng.get('end')
          };
        }
        if (good_vals) {
          yrs = {};
          _ref2 = this.frame.get('y_ranges');
          for (name in _ref2) {
            rng = _ref2[name];
            if ((rng.get('start') == null) || (rng.get('end') == null) || _.isNaN(rng.get('start') + rng.get('end'))) {
              good_vals = false;
              break;
            }
            yrs[name] = {
              start: rng.get('start'),
              end: rng.get('end')
            };
          }
        }
        if (good_vals) {
          this.initial_range_info = {
            xrs: xrs,
            yrs: yrs
          };
          return logger.debug("initial ranges set");
        } else {
          return logger.warn('could not set initial ranges');
        }
      };

      PlotView.prototype.render = function(force_canvas) {
        var canvas, ctx, frame, frame_box, k, sx, sy, th, title, toolbar_location, toolbar_selector, v, _ref1;
        if (force_canvas == null) {
          force_canvas = false;
        }
        logger.trace("Plot.render(force_canvas=" + force_canvas + ")");
        PlotView.__super__.render.call(this);
        this.canvas_view.render(force_canvas);
        toolbar_location = this.mget('toolbar_location');
        if (toolbar_location != null) {
          toolbar_selector = '.bk-plot-' + toolbar_location;
          logger.debug("attaching toolbar to " + toolbar_selector + " for plot " + this.model.id);
          this.tm_view = new ToolManager.View({
            model: this.mget('tool_manager'),
            el: this.$(toolbar_selector)
          });
          this.tm_view.render();
        }
        ctx = this.canvas_view.ctx;
        frame = this.model.get('frame');
        canvas = this.model.get('canvas');
        _ref1 = this.renderers;
        for (k in _ref1) {
          v = _ref1[k];
          if (v.model.update_layout != null) {
            v.model.update_layout(v, this.canvas.solver);
          }
        }
        title = this.mget('title');
        if (title) {
          this.title_props.set(this.canvas_view.ctx, {});
          th = ctx.measureText(this.mget('title')).ascent + this.model.get('title_standoff');
          if (th !== this.model.title_panel.get('height')) {
            this.model.title_panel.set('height', th);
          }
        }
        this.model.get('frame').set('width', canvas.get('width'));
        this.model.get('frame').set('height', canvas.get('height'));
        this.canvas.solver.update_variables(false);
        this.model.get('frame')._update_mappers();
        if (this.initial_range_info == null) {
          this.set_initial_range();
        }
        frame_box = [this.canvas.vx_to_sx(this.frame.get('left')), this.canvas.vy_to_sy(this.frame.get('top')), this.frame.get('width'), this.frame.get('height')];
        this._map_hook(ctx, frame_box);
        this._paint_empty(ctx, frame_box);
        if (this.outline_props.do_stroke) {
          this.outline_props.set(ctx, {});
          ctx.strokeRect.apply(ctx, frame_box);
        }
        this._render_levels(ctx, ['image', 'underlay', 'glyph'], frame_box);
        this._render_levels(ctx, ['overlay', 'tool']);
        if (title) {
          sx = this.canvas.vx_to_sx(this.canvas.get('width') / 2);
          sy = this.canvas.vy_to_sy(this.model.title_panel.get('bottom') + this.model.get('title_standoff'));
          this.title_props.set(ctx, {});
          return ctx.fillText(title, sx, sy);
        }
      };

      PlotView.prototype._render_levels = function(ctx, levels, clip_region) {
        var k, level, renderers, v, _i, _len;
        ctx.save();
        if (clip_region != null) {
          ctx.beginPath();
          ctx.rect.apply(ctx, clip_region);
          ctx.clip();
          ctx.beginPath();
        }
        for (_i = 0, _len = levels.length; _i < _len; _i++) {
          level = levels[_i];
          renderers = this.levels[level];
          for (k in renderers) {
            v = renderers[k];
            v.render();
          }
        }
        return ctx.restore();
      };

      PlotView.prototype._map_hook = function(ctx, frame_box) {};

      PlotView.prototype._paint_empty = function(ctx, frame_box) {
        ctx.fillStyle = this.mget('border_fill');
        ctx.fillRect(0, 0, this.canvas_view.mget('canvas_width'), this.canvas_view.mget('canvas_height'));
        ctx.fillStyle = this.mget('background_fill');
        return ctx.fillRect.apply(ctx, frame_box);
      };

      return PlotView;

    })(ContinuumView);
    Plot = (function(_super) {
      __extends(Plot, _super);

      function Plot() {
        _ref1 = Plot.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Plot.prototype.type = 'Plot';

      Plot.prototype.default_view = PlotView;

      Plot.prototype.initialize = function(attrs, options) {
        var canvas, r, _i, _len, _ref2, _ref3;
        Plot.__super__.initialize.call(this, attrs, options);
        canvas = new Canvas.Model({
          map: (_ref2 = this.use_map) != null ? _ref2 : false,
          canvas_width: this.get('plot_width'),
          canvas_height: this.get('plot_height'),
          hidpi: this.get('hidpi'),
          solver: new Solver()
        });
        this.set('canvas', canvas);
        this.solver = canvas.get('solver');
        _ref3 = this.get('renderers');
        for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
          r = _ref3[_i];
          r.set('parent', this);
        }
        this.set('tool_manager', new ToolManager.Model({
          tools: this.get('tools'),
          toolbar_location: this.get('toolbar_location')
        }));
        return logger.debug("Plot initialized");
      };

      Plot.prototype.initialize_layout = function(solver) {
        var canvas, elts, frame;
        canvas = this.get('canvas');
        frame = new CartesianFrame.Model({
          x_range: this.get('x_range'),
          extra_x_ranges: this.get('extra_x_ranges'),
          x_mapper_type: this.get('x_mapper_type'),
          y_range: this.get('y_range'),
          extra_y_ranges: this.get('extra_y_ranges'),
          y_mapper_type: this.get('y_mapper_type'),
          solver: solver
        });
        this.set('frame', frame);
        this.title_panel = new LayoutBox.Model({
          solver: solver
        });
        LayoutBox.Collection.add(this.title_panel);
        this.title_panel._anchor = this.title_panel._bottom;
        elts = this.get('above');
        elts.push(this.title_panel);
        return this.set('above', elts);
      };

      Plot.prototype.add_constraints = function(solver) {
        var do_side, min_border_bottom, min_border_left, min_border_right, min_border_top, _ref2, _ref3, _ref4, _ref5,
          _this = this;
        min_border_top = (_ref2 = this.get('min_border_top')) != null ? _ref2 : this.get('min_border');
        min_border_bottom = (_ref3 = this.get('min_border_bottom')) != null ? _ref3 : this.get('min_border');
        min_border_left = (_ref4 = this.get('min_border_left')) != null ? _ref4 : this.get('min_border');
        min_border_right = (_ref5 = this.get('min_border_right')) != null ? _ref5 : this.get('min_border');
        do_side = function(solver, min_size, side, cnames, dim, op) {
          var box, c0, c1, canvas, elts, frame, last, padding, r, _i, _len, _ref6;
          canvas = _this.get('canvas');
          frame = _this.get('frame');
          box = new LayoutBox.Model({
            solver: solver
          });
          c0 = '_' + cnames[0];
          c1 = '_' + cnames[1];
          solver.add_constraint(new Constraint(new Expr(box['_' + dim], -min_size), GE), kiwi.Strength.strong);
          solver.add_constraint(new Constraint(new Expr(frame[c0], [-1, box[c1]]), EQ));
          solver.add_constraint(new Constraint(new Expr(box[c0], [-1, canvas[c0]]), EQ));
          last = frame;
          elts = _this.get(side);
          for (_i = 0, _len = elts.length; _i < _len; _i++) {
            r = elts[_i];
            if ((_ref6 = r.get('location')) != null ? _ref6 : 'auto' === 'auto') {
              r.set('location', side, {
                'silent': true
              });
            }
            if (r.initialize_layout != null) {
              r.initialize_layout(solver);
            }
            solver.add_constraint(new Constraint(new Expr(last[c0], [-1, r[c1]]), EQ), kiwi.Strength.strong);
            last = r;
          }
          padding = new LayoutBox.Model({
            solver: solver
          });
          solver.add_constraint(new Constraint(new Expr(last[c0], [-1, padding[c1]]), EQ), kiwi.Strength.strong);
          return solver.add_constraint(new Constraint(new Expr(padding[c0], [-1, canvas[c0]]), EQ), kiwi.Strength.strong);
        };
        do_side(solver, min_border_top, 'above', ['top', 'bottom'], 'height', LE);
        do_side(solver, min_border_bottom, 'below', ['bottom', 'top'], 'height', GE);
        do_side(solver, min_border_left, 'left', ['left', 'right'], 'width', GE);
        return do_side(solver, min_border_right, 'right', ['right', 'left'], 'width', LE);
      };

      Plot.prototype.add_renderers = function(new_renderers) {
        var renderers;
        renderers = this.get('renderers');
        renderers = renderers.concat(new_renderers);
        return this.set('renderers', renderers);
      };

      Plot.prototype.parent_properties = ['background_fill', 'border_fill', 'min_border', 'min_border_top', 'min_border_bottom', 'min_border_left', 'min_border_right'];

      Plot.prototype.defaults = function() {
        return _.extend({}, Plot.__super__.defaults.call(this), {
          renderers: [],
          tools: [],
          h_symmetry: true,
          v_symmetry: false,
          x_mapper_type: 'auto',
          y_mapper_type: 'auto',
          plot_width: 600,
          plot_height: 600,
          title: 'Plot',
          above: [],
          below: [],
          left: [],
          right: [],
          toolbar_location: "above"
        });
      };

      Plot.prototype.display_defaults = function() {
        return _.extend({}, Plot.__super__.display_defaults.call(this), {
          hidpi: true,
          background_fill: "#fff",
          border_fill: "#fff",
          min_border: 40,
          title_standoff: 8,
          title_text_font: "helvetica",
          title_text_font_size: "20pt",
          title_text_font_style: "normal",
          title_text_color: "#444444",
          title_text_alpha: 1.0,
          title_text_align: "center",
          title_text_baseline: "alphabetic",
          outline_line_color: '#aaaaaa',
          outline_line_width: 1,
          outline_line_alpha: 1.0,
          outline_line_join: 'miter',
          outline_line_cap: 'butt',
          outline_line_dash: [],
          outline_line_dash_offset: 0
        });
      };

      return Plot;

    })(HasParent);
    Plots = (function(_super) {
      __extends(Plots, _super);

      function Plots() {
        _ref2 = Plots.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      Plots.prototype.model = Plot;

      return Plots;

    })(Collection);
    return {
      "Model": Plot,
      "Collection": new Plots(),
      "View": PlotView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=plot.js.map
*/