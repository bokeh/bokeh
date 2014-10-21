(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["./collection", "kiwi", "./canvas_template", "./continuum_view", "./layout_box", "./logging", "./solver"], function(Collection, kiwi, canvas_template, ContinuumView, LayoutBox, Logging, Solver) {
    var Canvas, CanvasView, Canvases, Constraint, EQ, Expr, logger, _ref, _ref1, _ref2;
    Expr = kiwi.Expression;
    Constraint = kiwi.Constraint;
    EQ = kiwi.Operator.Eq;
    logger = Logging.logger;
    CanvasView = (function(_super) {
      __extends(CanvasView, _super);

      function CanvasView() {
        _ref = CanvasView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      CanvasView.prototype.className = "bk-canvas-wrapper";

      CanvasView.prototype.template = canvas_template;

      CanvasView.prototype.initialize = function(options) {
        var html, template_data, _ref1;
        CanvasView.__super__.initialize.call(this, options);
        template_data = {
          map: this.mget('map')
        };
        html = this.template(template_data);
        this.$el.html(html);
        this.canvas_wrapper = this.$el;
        this.canvas = this.$('canvas.bk-canvas');
        this.canvas_events = this.$('div.bk-canvas-events');
        this.canvas_overlay = this.$('div.bk-canvas-overlays');
        this.map_div = (_ref1 = this.$('div.bk-canvas-map')) != null ? _ref1 : null;
        return logger.debug("CanvasView initialized");
      };

      CanvasView.prototype.render = function(force) {
        var backingStoreRatio, devicePixelRatio, height, ratio, width;
        if (force == null) {
          force = false;
        }
        if (!this.model.new_bounds && !force) {
          return;
        }
        this.ctx = this.canvas[0].getContext('2d');
        if (this.mget('use_hidpi')) {
          devicePixelRatio = window.devicePixelRatio || 1;
          backingStoreRatio = this.ctx.webkitBackingStorePixelRatio || this.ctx.mozBackingStorePixelRatio || this.ctx.msBackingStorePixelRatio || this.ctx.oBackingStorePixelRatio || this.ctx.backingStorePixelRatio || 1;
          ratio = devicePixelRatio / backingStoreRatio;
        } else {
          ratio = 1;
        }
        width = this.mget('width');
        height = this.mget('height');
        this.canvas.width = width * this.dpi_ratio;
        this.canvas.height = height * this.dpi_ratio;
        this.$el.attr('style', "z-index: 50; width:" + width + "px; height:" + height + "px");
        this.canvas.attr('style', "width:" + width + "px;height:" + height + "px");
        this.canvas.attr('width', width * ratio).attr('height', height * ratio);
        this.$el.attr("width", width).attr('height', height);
        this.canvas_events.attr('style', "z-index:100; position:absolute; top:0; left:0; width:" + width + "px; height:" + height + "px;");
        this.canvas_overlay.attr('style', "z-index:75; position:absolute; top:0; left:0; width:" + width + "px; height:" + height + "px;");
        this.ctx.scale(ratio, ratio);
        this.ctx.translate(0.5, 0.5);
        this._fixup_line_dash(this.ctx);
        this._fixup_line_dash_offset(this.ctx);
        this._fixup_image_smoothing(this.ctx);
        this._fixup_measure_text(this.ctx);
        return this.model.new_bounds = false;
      };

      CanvasView.prototype._fixup_line_dash = function(ctx) {
        if (!ctx.setLineDash) {
          ctx.setLineDash = function(dash) {
            ctx.mozDash = dash;
            return ctx.webkitLineDash = dash;
          };
        }
        if (!ctx.getLineDash) {
          return ctx.getLineDash = function() {
            return ctx.mozDash;
          };
        }
      };

      CanvasView.prototype._fixup_line_dash_offset = function(ctx) {
        ctx.setLineDashOffset = function(dash_offset) {
          ctx.lineDashOffset = dash_offset;
          ctx.mozDashOffset = dash_offset;
          return ctx.webkitLineDashOffset = dash_offset;
        };
        return ctx.getLineDashOffset = function() {
          return ctx.mozDashOffset;
        };
      };

      CanvasView.prototype._fixup_image_smoothing = function(ctx) {
        ctx.setImageSmoothingEnabled = function(value) {
          ctx.imageSmoothingEnabled = value;
          ctx.mozImageSmoothingEnabled = value;
          ctx.oImageSmoothingEnabled = value;
          return ctx.webkitImageSmoothingEnabled = value;
        };
        return ctx.getImageSmoothingEnabled = function() {
          var _ref1;
          return (_ref1 = ctx.imageSmoothingEnabled) != null ? _ref1 : true;
        };
      };

      CanvasView.prototype._fixup_measure_text = function(ctx) {
        if (ctx.measureText && (ctx.html5MeasureText == null)) {
          ctx.html5MeasureText = ctx.measureText;
          return ctx.measureText = function(text) {
            var textMetrics;
            textMetrics = ctx.html5MeasureText(text);
            textMetrics.ascent = ctx.html5MeasureText("m").width * 1.6;
            return textMetrics;
          };
        }
      };

      return CanvasView;

    })(ContinuumView);
    Canvas = (function(_super) {
      __extends(Canvas, _super);

      function Canvas() {
        _ref1 = Canvas.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Canvas.prototype.type = 'Canvas';

      Canvas.prototype.default_view = CanvasView;

      Canvas.prototype.initialize = function(attr, options) {
        var solver;
        solver = new Solver();
        this.set('solver', solver);
        Canvas.__super__.initialize.call(this, attr, options);
        this.new_bounds = true;
        solver.add_constraint(new Constraint(new Expr(this._left), EQ));
        solver.add_constraint(new Constraint(new Expr(this._bottom), EQ));
        this._set_dims([this.get('canvas_width'), this.get('canvas_height')]);
        return logger.debug("Canvas initialized");
      };

      Canvas.prototype.vx_to_sx = function(x) {
        return x;
      };

      Canvas.prototype.vy_to_sy = function(y) {
        return this.get('height') - y;
      };

      Canvas.prototype.v_vx_to_sx = function(xx) {
        var idx, x, _i, _len;
        for (idx = _i = 0, _len = xx.length; _i < _len; idx = ++_i) {
          x = xx[idx];
          xx[idx] = x;
        }
        return xx;
      };

      Canvas.prototype.v_vy_to_sy = function(yy) {
        var canvas_height, idx, y, _i, _len;
        canvas_height = this.get('height');
        for (idx = _i = 0, _len = yy.length; _i < _len; idx = ++_i) {
          y = yy[idx];
          yy[idx] = canvas_height - y;
        }
        return yy;
      };

      Canvas.prototype.sx_to_vx = function(x) {
        return x;
      };

      Canvas.prototype.sy_to_vy = function(y) {
        return this.get('height') - y;
      };

      Canvas.prototype.v_sx_to_vx = function(xx) {
        var idx, x, _i, _len;
        for (idx = _i = 0, _len = xx.length; _i < _len; idx = ++_i) {
          x = xx[idx];
          xx[idx] = x;
        }
        return xx;
      };

      Canvas.prototype.v_sy_to_vy = function(yy) {
        var canvas_height, idx, y, _i, _len;
        canvas_height = this.get('height');
        for (idx = _i = 0, _len = yy.length; _i < _len; idx = ++_i) {
          y = yy[idx];
          yy[idx] = canvas_height - y;
        }
        return yy;
      };

      Canvas.prototype._set_width = function(width, update) {
        if (update == null) {
          update = true;
        }
        if (this._width_constraint != null) {
          this.solver.remove_constraint(this._width_constraint);
        }
        this._width_constraint = new Constraint(new Expr(this._width, -width), EQ);
        this.solver.add_constraint(this._width_constraint);
        if (update) {
          this.solver.update_variables();
        }
        return this.new_bounds = true;
      };

      Canvas.prototype._set_height = function(height, update) {
        if (update == null) {
          update = true;
        }
        if (this._height_constraint != null) {
          this.solver.remove_constraint(this._height_constraint);
        }
        this._height_constraint = new Constraint(new Expr(this._height, -height), EQ);
        this.solver.add_constraint(this._height_constraint);
        if (update) {
          this.solver.update_variables();
        }
        return this.new_bounds = true;
      };

      Canvas.prototype._set_dims = function(dims) {
        this._set_width(dims[0], false);
        this._set_height(dims[1], false);
        return this.solver.update_variables();
      };

      Canvas.prototype.defaults = function() {
        return _.extend({}, Canvas.__super__.defaults.call(this), {
          width: 300,
          height: 300,
          map: false,
          mousedown_callbacks: [],
          mousemove_callbacks: [],
          use_hidpi: true
        });
      };

      return Canvas;

    })(LayoutBox.Model);
    Canvases = (function(_super) {
      __extends(Canvases, _super);

      function Canvases() {
        _ref2 = Canvases.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      Canvases.prototype.model = Canvas;

      return Canvases;

    })(Collection);
    return {
      "Model": Canvas,
      "Collection": new Canvases()
    };
  });

}).call(this);

/*
//@ sourceMappingURL=canvas.js.map
*/