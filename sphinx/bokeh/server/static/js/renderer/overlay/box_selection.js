(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "common/has_parent", "common/collection", "common/plot_widget"], function(_, HasParent, Collection, PlotWidget) {
    var BoxSelection, BoxSelectionView, BoxSelections, _ref, _ref1, _ref2;
    BoxSelectionView = (function(_super) {
      __extends(BoxSelectionView, _super);

      function BoxSelectionView() {
        _ref = BoxSelectionView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      BoxSelectionView.prototype.initialize = function(options) {
        BoxSelectionView.__super__.initialize.call(this, options);
        this.$el.appendTo(this.plot_view.$el.find('div.bk-canvas-overlays'));
        this.$el.addClass('shading');
        return this.$el.hide();
      };

      BoxSelectionView.prototype.bind_bokeh_events = function() {
        return this.listenTo(this.model, 'change:data', this._draw_box);
      };

      BoxSelectionView.prototype.render = function() {
        this._draw_box();
        return this;
      };

      BoxSelectionView.prototype._draw_box = function() {
        var canvas, data, sh, style, sw, sx, sy, vxlim, vylim;
        data = this.mget('data');
        if (_.isEmpty(data)) {
          this.$el.hide();
          return;
        }
        vxlim = data.vxlim;
        vylim = data.vylim;
        canvas = this.plot_view.canvas;
        sx = Math.min(canvas.vx_to_sx(vxlim[0]), canvas.vx_to_sx(vxlim[1]));
        sy = Math.min(canvas.vy_to_sy(vylim[0]), canvas.vy_to_sy(vylim[1]));
        sw = Math.abs(vxlim[1] - vxlim[0]);
        sh = Math.abs(vylim[1] - vylim[0]);
        style = "left:" + sx + "px; width:" + sw + "px; top:" + sy + "px; height:" + sh + "px";
        this.$el.attr('style', style);
        return this.$el.show();
      };

      return BoxSelectionView;

    })(PlotWidget);
    BoxSelection = (function(_super) {
      __extends(BoxSelection, _super);

      function BoxSelection() {
        _ref1 = BoxSelection.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      BoxSelection.prototype.default_view = BoxSelectionView;

      BoxSelection.prototype.type = "BoxSelection";

      BoxSelection.prototype.defaults = function() {
        return _.extend({}, BoxSelection.__super__.defaults.call(this), {
          level: 'overlay',
          data: {}
        });
      };

      return BoxSelection;

    })(HasParent);
    BoxSelections = (function(_super) {
      __extends(BoxSelections, _super);

      function BoxSelections() {
        _ref2 = BoxSelections.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      BoxSelections.prototype.model = BoxSelection;

      return BoxSelections;

    })(Collection);
    return {
      "Model": BoxSelection,
      "Collection": new BoxSelections(),
      "View": BoxSelectionView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=box_selection.js.map
*/