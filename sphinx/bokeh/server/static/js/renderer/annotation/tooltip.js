(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "common/has_parent", "common/plot_widget", "common/collection", "common/logging"], function(_, HasParent, PlotWidget, Collection, Logging) {
    var Tooltip, TooltipView, Tooltips, logger, _ref, _ref1, _ref2;
    logger = Logging.logger;
    TooltipView = (function(_super) {
      __extends(TooltipView, _super);

      function TooltipView() {
        _ref = TooltipView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      TooltipView.prototype.className = "bk-tooltip";

      TooltipView.prototype.initialize = function(options) {
        TooltipView.__super__.initialize.call(this, options);
        this.$el.appendTo(this.plot_view.$el.find('div.bk-canvas-overlays'));
        this.$el.css({
          'z-index': 1010
        });
        return this.$el.hide();
      };

      TooltipView.prototype.bind_bokeh_events = function() {
        return this.listenTo(this.model, 'change:data', this._draw_tips);
      };

      TooltipView.prototype.render = function() {
        return this._draw_tips();
      };

      TooltipView.prototype._draw_tips = function() {
        var content, left, ow, side, sx, sy, tip, top, val, vx, vy, _i, _len, _ref1;
        this.$el.empty();
        this.$el.hide();
        if (_.isEmpty(this.mget('data'))) {
          return;
        }
        _ref1 = this.mget('data');
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          val = _ref1[_i];
          vx = val[0], vy = val[1], content = val[2];
          if (this.mget('inner_only') && !this.plot_view.frame.contains(vx, vy)) {
            continue;
          }
          tip = $('<div />').appendTo(this.$el);
          tip.append(content);
        }
        sx = this.plot_view.mget('canvas').vx_to_sx(vx);
        sy = this.plot_view.mget('canvas').vy_to_sy(vy);
        side = this.mget('side');
        if (side === 'auto') {
          ow = this.plot_view.frame.get('width');
          if (vx - this.plot_view.frame.get('left') < ow / 2) {
            side = 'right';
          } else {
            side = 'left';
          }
        }
        this.$el.removeClass('right');
        this.$el.removeClass('left');
        if (side === "right") {
          this.$el.addClass("left");
          top = sy - this.$el.height() / 2;
          left = sx + 18;
        } else if (side === "left") {
          this.$el.addClass("right");
          top = sy - this.$el.height() / 2;
          left = sx - this.$el.width() - 23;
        } else {
          logger.warn("invalid tooltip side: '" + side + "'");
          return;
        }
        if (this.$el.children().length > 0) {
          this.$el.css({
            top: top,
            left: left
          });
          return this.$el.show();
        }
      };

      return TooltipView;

    })(PlotWidget);
    Tooltip = (function(_super) {
      __extends(Tooltip, _super);

      function Tooltip() {
        _ref1 = Tooltip.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Tooltip.prototype.default_view = TooltipView;

      Tooltip.prototype.type = 'Tooltip';

      Tooltip.prototype.clear = function() {
        return this.set('data', []);
      };

      Tooltip.prototype.add = function(vx, vy, content) {
        var data;
        data = this.get('data');
        data.push([vx, vy, content]);
        return this.set('data', data);
      };

      Tooltip.prototype.defaults = function() {
        return _.extend({}, Tooltip.__super__.defaults.call(this), {
          level: 'overlay',
          side: "auto",
          inner_only: true
        });
      };

      return Tooltip;

    })(HasParent);
    Tooltips = (function(_super) {
      __extends(Tooltips, _super);

      function Tooltips() {
        _ref2 = Tooltips.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      Tooltips.prototype.model = Tooltip;

      return Tooltips;

    })(Collection);
    return {
      "Model": Tooltip,
      "Collection": new Tooltips(),
      "View": TooltipView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=tooltip.js.map
*/