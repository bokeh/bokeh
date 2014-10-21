(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "common/has_parent", "common/plot_widget", "common/collection", "common/textutils", "renderer/properties"], function(_, HasParent, PlotWidget, Collection, textutils, properties) {
    var Legend, LegendView, Legends, _ref, _ref1, _ref2;
    LegendView = (function(_super) {
      __extends(LegendView, _super);

      function LegendView() {
        _ref = LegendView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      LegendView.prototype.initialize = function(options) {
        LegendView.__super__.initialize.call(this, options);
        this.label_props = new properties.Text(this, 'label_');
        this.border_props = new properties.Line(this, 'border_');
        if (this.mget('legend_names')) {
          this.legend_names = this.mget('legend_names');
        } else {
          this.legends = this.mget('legends');
          this.legend_names = _.keys(this.mget('legends'));
        }
        this.need_calc_dims = true;
        return this.listenTo(this.plot_model.solver, 'layout_update', function() {
          return this.need_calc_dims = true;
        });
      };

      LegendView.prototype.calc_dims = function(options) {
        var ctx, h_range, label_height, label_width, legend_padding, legend_spacing, orientation, text_width, text_widths, v_range, x, y, _ref1;
        label_height = this.mget('label_height');
        this.glyph_height = this.mget('glyph_height');
        label_width = this.mget('label_width');
        this.glyph_width = this.mget('glyph_width');
        legend_spacing = this.mget('legend_spacing');
        this.label_height = _.max([textutils.getTextHeight(this.label_props.font(this)), label_height, this.glyph_height]);
        this.legend_height = this.label_height;
        this.legend_height = this.legend_names.length * this.legend_height + (1 + this.legend_names.length) * legend_spacing;
        ctx = this.plot_view.canvas_view.ctx;
        ctx.save();
        this.label_props.set(ctx, this);
        text_widths = _.map(this.legend_names, function(txt) {
          return ctx.measureText(txt).width;
        });
        ctx.restore();
        text_width = _.max(text_widths);
        this.label_width = _.max([text_width, label_width]);
        this.legend_width = this.label_width + this.glyph_width + 3 * legend_spacing;
        orientation = this.mget('orientation');
        legend_padding = this.mget('legend_padding');
        h_range = this.plot_view.frame.get('h_range');
        v_range = this.plot_view.frame.get('v_range');
        if (orientation === "top_right") {
          x = h_range.get('end') - legend_padding - this.legend_width;
          y = v_range.get('end') - legend_padding;
        } else if (orientation === "top_left") {
          x = h_range.get('start') + legend_padding;
          y = v_range.get('end') - legend_padding;
        } else if (orientation === "bottom_left") {
          x = h_range.get('start') + legend_padding;
          y = v_range.get('start') + legend_padding + this.legend_height;
        } else if (orientation === "bottom_right") {
          x = h_range.get('end') - legend_padding - this.legend_width;
          y = v_range.get('start') + legend_padding + this.legend_height;
        } else if (orientation === "absolute") {
          _ref1 = this.absolute_coords, x = _ref1[0], y = _ref1[1];
        }
        x = this.plot_view.canvas.vx_to_sx(x);
        y = this.plot_view.canvas.vy_to_sy(y);
        return this.box_coords = [x, y];
      };

      LegendView.prototype.render = function() {
        var ctx, idx, legend_name, legend_spacing, renderer, view, x, x1, x2, y, y1, y2, yoffset, yspacing, _i, _j, _len, _len1, _ref1, _ref2;
        if (this.need_calc_dims) {
          this.calc_dims();
          this.need_calc_dims = false;
        }
        ctx = this.plot_view.canvas_view.ctx;
        ctx.save();
        ctx.fillStyle = this.plot_model.get('background_fill');
        this.border_props.set(ctx, this);
        ctx.beginPath();
        ctx.rect(this.box_coords[0], this.box_coords[1], this.legend_width, this.legend_height);
        ctx.fill();
        ctx.stroke();
        legend_spacing = this.mget('legend_spacing');
        _ref1 = this.legend_names;
        for (idx = _i = 0, _len = _ref1.length; _i < _len; idx = ++_i) {
          legend_name = _ref1[idx];
          yoffset = idx * this.label_height;
          yspacing = (1 + idx) * legend_spacing;
          y = this.box_coords[1] + this.label_height / 2.0 + yoffset + yspacing;
          x = this.box_coords[0] + legend_spacing;
          x1 = this.box_coords[0] + 2 * legend_spacing + this.label_width;
          x2 = x1 + this.glyph_width;
          y1 = this.box_coords[1] + yoffset + yspacing;
          y2 = y1 + this.glyph_height;
          this.label_props.set(ctx, this);
          ctx.fillText(legend_name, x, y);
          _ref2 = this.model.resolve_ref(this.legends[legend_name]);
          for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
            renderer = _ref2[_j];
            view = this.plot_view.renderers[renderer.id];
            view.draw_legend(ctx, x1, x2, y1, y2);
          }
        }
        return ctx.restore();
      };

      return LegendView;

    })(PlotWidget);
    Legend = (function(_super) {
      __extends(Legend, _super);

      function Legend() {
        _ref1 = Legend.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Legend.prototype.default_view = LegendView;

      Legend.prototype.type = 'Legend';

      Legend.prototype.display_defaults = function() {
        return _.extend({}, Legend.__super__.display_defaults.call(this), {
          level: 'overlay',
          border_line_color: 'black',
          border_line_width: 1,
          border_line_alpha: 1.0,
          border_line_join: 'miter',
          border_line_cap: 'butt',
          border_line_dash: [],
          border_line_dash_offset: 0,
          label_standoff: 15,
          label_text_font: "helvetica",
          label_text_font_size: "10pt",
          label_text_font_style: "normal",
          label_text_color: "#444444",
          label_text_alpha: 1.0,
          label_text_align: "left",
          label_text_baseline: "middle",
          glyph_height: 20,
          glyph_width: 20,
          label_height: 20,
          label_width: 50,
          legend_padding: 10,
          legend_spacing: 3,
          orientation: "top_right",
          datapoint: null
        });
      };

      return Legend;

    })(HasParent);
    Legends = (function(_super) {
      __extends(Legends, _super);

      function Legends() {
        _ref2 = Legends.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      Legends.prototype.model = Legend;

      return Legends;

    })(Collection);
    return {
      "Model": Legend,
      "Collection": new Legends(),
      "View": LegendView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=legend.js.map
*/