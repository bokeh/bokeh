(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["common/plot_widget", "common/has_properties", "common/logging"], function(PlotWidget, HasProperties, Logging) {
    var Tool, ToolView, logger, _ref, _ref1;
    logger = Logging.logger;
    ToolView = (function(_super) {
      __extends(ToolView, _super);

      function ToolView() {
        _ref = ToolView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      ToolView.prototype.bind_bokeh_events = function() {
        var _this = this;
        return this.listenTo(this.model, 'change:active', function() {
          if (_this.mget('active')) {
            return _this.activate();
          } else {
            return _this.deactivate();
          }
        });
      };

      ToolView.prototype.activate = function() {};

      ToolView.prototype.deactivate = function() {};

      return ToolView;

    })(PlotWidget);
    Tool = (function(_super) {
      __extends(Tool, _super);

      function Tool() {
        _ref1 = Tool.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      Tool.prototype._check_dims = function(dims, tool_name) {
        var hdim, wdim, _ref2;
        _ref2 = [false, false], wdim = _ref2[0], hdim = _ref2[1];
        if (dims.length === 0) {
          logger.warn("" + tool_name + " given empty dimensions");
        } else if (dims.length === 1) {
          if (dims[0] !== 'width' && dims[0] !== 'height') {
            logger.warn("" + tool_name + " given unrecognized dimensions: " + dims);
          }
        } else if (dims.length === 2) {
          if (dims.indexOf('width') < 0 || dims.indexOf('height') < 0) {
            logger.warn("" + tool_name + " given unrecognized dimensions: " + dims);
          }
        } else {
          logger.warn("" + tool_name + " given more than two dimensions: " + dims);
        }
        if (dims.indexOf('width') >= 0) {
          wdim = true;
        }
        if (dims.indexOf('height') >= 0) {
          hdim = true;
        }
        return [wdim, hdim];
      };

      Tool.prototype._get_dim_tooltip = function(name, _arg) {
        var hdim, wdim;
        wdim = _arg[0], hdim = _arg[1];
        if (wdim && !hdim) {
          return "" + name + " (x-axis)";
        } else if (hdim && !wdim) {
          return "" + name + " (y-axis)";
        } else {
          return name;
        }
      };

      Tool.prototype._get_dim_limits = function(_arg, _arg1, frame, dims) {
        var hr, vr, vx0, vx1, vxlim, vy0, vy1, vylim;
        vx0 = _arg[0], vy0 = _arg[1];
        vx1 = _arg1[0], vy1 = _arg1[1];
        hr = frame.get('h_range');
        if (dims.indexOf('width') >= 0) {
          vxlim = [_.min([vx0, vx1]), _.max([vx0, vx1])];
          vxlim = [_.max([vxlim[0], hr.get('min')]), _.min([vxlim[1], hr.get('max')])];
        } else {
          vxlim = [hr.get('min'), hr.get('max')];
        }
        vr = frame.get('v_range');
        if (dims.indexOf('height') >= 0) {
          vylim = [_.min([vy0, vy1]), _.max([vy0, vy1])];
          vylim = [_.max([vylim[0], vr.get('min')]), _.min([vylim[1], vr.get('max')])];
        } else {
          vylim = [vr.get('min'), vr.get('max')];
        }
        return [vxlim, vylim];
      };

      Tool.prototype.defaults = function() {
        return _.extend({}, Tool.__super__.defaults.call(this), {
          tool_name: this.tool_name,
          level: 'overlay'
        });
      };

      return Tool;

    })(HasProperties);
    return {
      "Model": Tool,
      "View": ToolView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=tool.js.map
*/