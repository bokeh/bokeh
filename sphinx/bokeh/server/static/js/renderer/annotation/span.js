(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "common/has_parent", "common/plot_widget", "common/collection", "common/logging"], function(_, HasParent, PlotWidget, Collection, Logging) {
    var Span, SpanView, Spans, logger, _ref, _ref1, _ref2;
    logger = Logging.logger;
    SpanView = (function(_super) {
      __extends(SpanView, _super);

      function SpanView() {
        _ref = SpanView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      SpanView.prototype.initialize = function(options) {
        SpanView.__super__.initialize.call(this, options);
        this.$el.appendTo(this.plot_view.$el.find('div.bk-canvas-overlays'));
        this.$el.css({
          position: 'absolute'
        });
        return this.$el.hide();
      };

      SpanView.prototype.bind_bokeh_events = function() {
        return this.listenTo(this.model, 'change:location', this._draw_span);
      };

      SpanView.prototype.render = function() {
        return this._draw_span();
      };

      SpanView.prototype._draw_span = function() {
        var canvas, frame, height, left, top, width;
        if (this.mget('location') == null) {
          this.$el.hide();
          return;
        }
        frame = this.plot_model.get('frame');
        canvas = this.plot_model.get('canvas');
        if (this.mget('dimension') === 'width') {
          top = canvas.vy_to_sy(this.mget('location'));
          left = canvas.vx_to_sx(frame.get('left'));
          width = "" + (frame.get('width')) + "px";
          height = "1px";
        } else {
          top = canvas.vy_to_sy(frame.get('top'));
          left = canvas.vx_to_sx(this.mget('location'));
          width = "1px";
          height = "" + (frame.get('height')) + "px";
        }
        this.$el.css({
          'top': top,
          'left': left,
          'width': width,
          'height': height,
          'z-index': 1000,
          'background-color': this.mget('color')
        });
        return this.$el.show();
      };

      return SpanView;

    })(PlotWidget);
    Span = (function(_super) {
      __extends(Span, _super);

      function Span() {
        _ref1 = Span.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Span.prototype.default_view = SpanView;

      Span.prototype.type = 'Span';

      Span.prototype.defaults = function() {
        return _.extend({}, Span.__super__.defaults.call(this), {
          level: "overlay",
          dimension: "width",
          units: "screen",
          color: "black"
        });
      };

      return Span;

    })(HasParent);
    Spans = (function(_super) {
      __extends(Spans, _super);

      function Spans() {
        _ref2 = Spans.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      Spans.prototype.model = Span;

      return Spans;

    })(Collection);
    return {
      "Model": Span,
      "Collection": new Spans(),
      "View": SpanView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=span.js.map
*/