(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "sprintf", "common/collection", "renderer/annotation/tooltip", "./inspect_tool"], function(_, sprintf, Collection, Tooltip, InspectTool) {
    var HoverTool, HoverToolView, HoverTools, _color_to_hex, _format_number, _ref, _ref1, _ref2;
    _color_to_hex = function(color) {
      var blue, digits, green, red, rgb;
      if (color.substr(0, 1) === '#') {
        return color;
      }
      digits = /(.*?)rgb\((\d+), (\d+), (\d+)\)/.exec(color);
      red = parseInt(digits[2]);
      green = parseInt(digits[3]);
      blue = parseInt(digits[4]);
      rgb = blue | (green << 8) | (red << 16);
      return digits[1] + '#' + rgb.toString(16);
    };
    _format_number = function(number) {
      if (typeof number === "string") {
        return number;
      }
      if (Math.floor(number) === number) {
        return sprintf("%d", number);
      }
      if (Math.abs(number) > 0.1 && Math.abs(number) < 1000) {
        return sprintf("%0.3f", number);
      }
      return sprintf("%0.3e", number);
    };
    HoverToolView = (function(_super) {
      __extends(HoverToolView, _super);

      function HoverToolView() {
        _ref = HoverToolView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      HoverToolView.prototype.bind_bokeh_events = function() {
        var r, _i, _len, _ref1;
        _ref1 = this.mget('renderers');
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          r = _ref1[_i];
          this.listenTo(r.get('data_source'), 'inspect', this._update);
        }
        return this.plot_view.canvas_view.canvas_wrapper.css('cursor', 'crosshair');
      };

      HoverToolView.prototype._move = function(e) {
        var canvas, vx, vy;
        if (!this.mget('active')) {
          return;
        }
        canvas = this.plot_view.canvas;
        vx = canvas.sx_to_vx(e.bokeh.sx);
        vy = canvas.sy_to_vy(e.bokeh.sy);
        if (!this.plot_view.frame.contains(vx, vy)) {
          this.mget('tooltip').clear();
          return;
        }
        return this._inspect(vx, vy);
      };

      HoverToolView.prototype._move_exit = function() {
        return this.mget('tooltip').clear();
      };

      HoverToolView.prototype._inspect = function(vx, vy, e) {
        var geometry, r, sm, _i, _len, _ref1, _results;
        geometry = {
          type: 'point',
          vx: vx,
          vy: vy
        };
        _ref1 = this.mget('renderers');
        _results = [];
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          r = _ref1[_i];
          sm = r.get('data_source').get('selection_manager');
          _results.push(sm.inspect(this, this.plot_view.renderers[r.id], geometry, {
            "geometry": geometry
          }));
        }
        return _results;
      };

      HoverToolView.prototype._update = function(indices, tool, renderer, ds, _arg) {
        var canvas, colname, color, column, column_name, dsvalue, frame, geometry, hex, i, label, match, opts, row, rx, ry, span, swatch, sx, sy, table, td, unused, value, vx, vy, x, xmapper, y, ymapper, _i, _len, _ref1, _ref2, _ref3, _ref4;
        geometry = _arg.geometry;
        this.mget('tooltip').clear();
        if (indices.length === 0) {
          return;
        }
        vx = geometry.vx;
        vy = geometry.vy;
        canvas = this.plot_model.get('canvas');
        frame = this.plot_model.get('frame');
        sx = canvas.vx_to_sx(vx);
        sy = canvas.vy_to_sy(vy);
        xmapper = frame.get('x_mappers')[renderer.mget('x_range_name')];
        ymapper = frame.get('y_mappers')[renderer.mget('y_range_name')];
        x = xmapper.map_from_target(vx);
        y = ymapper.map_from_target(vy);
        for (_i = 0, _len = indices.length; _i < _len; _i++) {
          i = indices[_i];
          if (this.mget('snap_to_marker')) {
            rx = canvas.sx_to_vx(renderer.sx[i]);
            ry = canvas.sy_to_vy(renderer.sy[i]);
          } else {
            _ref1 = [vx, vy], rx = _ref1[0], ry = _ref1[1];
          }
          table = $('<table></table>');
          _ref2 = this.mget("tooltips");
          for (label in _ref2) {
            value = _ref2[label];
            row = $("<tr></tr>");
            row.append($("<td class='bk-tooltip-row-label'>" + label + ": </td>"));
            td = $("<td class='bk-tooltip-row-value'></td>");
            if (value.indexOf("$color") >= 0) {
              _ref3 = value.match(/\$color(\[.*\])?:(\w*)/), match = _ref3[0], opts = _ref3[1], colname = _ref3[2];
              column = ds.get_column(colname);
              if (column == null) {
                span = $("<span>" + colname + " unknown</span>");
                td.append(span);
                continue;
              }
              hex = (opts != null ? opts.indexOf("hex") : void 0) >= 0;
              swatch = (opts != null ? opts.indexOf("swatch") : void 0) >= 0;
              color = column[i];
              if (color == null) {
                span = $("<span>(null)</span>");
                td.append(span);
                continue;
              }
              if (hex) {
                color = _color_to_hex(color);
              }
              span = $("<span>" + color + "</span>");
              td.append(span);
              if (swatch) {
                span = $("<span class='bk-tooltip-color-block'> </span>");
                span.css({
                  backgroundColor: color
                });
              }
              td.append(span);
            } else {
              value = value.replace("$index", "" + i);
              value = value.replace("$x", "" + (_format_number(x)));
              value = value.replace("$y", "" + (_format_number(y)));
              value = value.replace("$vx", "" + vx);
              value = value.replace("$vy", "" + vy);
              value = value.replace("$sx", "" + sx);
              value = value.replace("$sy", "" + sy);
              while (value.indexOf("@") >= 0) {
                _ref4 = value.match(/(@)(\w*)/), match = _ref4[0], unused = _ref4[1], column_name = _ref4[2];
                column = ds.get_column(column_name);
                if (column == null) {
                  value = value.replace(column_name, "" + column_name + " unknown");
                  break;
                }
                column = ds.get_column(column_name);
                dsvalue = column[i];
                if (typeof dsvalue === "number") {
                  value = value.replace(match, "" + (_format_number(dsvalue)));
                } else {
                  value = value.replace(match, "" + dsvalue);
                }
              }
              span = $("<span>" + value + "</span>");
              td.append(span);
            }
            row.append(td);
            table.append(row);
          }
          this.mget('tooltip').add(rx, ry, table);
        }
        return null;
      };

      return HoverToolView;

    })(InspectTool.View);
    HoverTool = (function(_super) {
      var icon;

      __extends(HoverTool, _super);

      function HoverTool() {
        _ref1 = HoverTool.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      HoverTool.prototype.default_view = HoverToolView;

      HoverTool.prototype.type = "HoverTool";

      HoverTool.prototype.tool_name = "Hover Tool";

      icon = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAA8ElEQVQ4T42T0Q2CMBCGaQjPxgmMG/jelIQN3ECZQEfADRwBJzBuQCC81wlkBHxvqP8lmhTsUfpSWvp/vfvvKiJn1HVdpml6dPdC38I90DSNxVobYzKMPiSm/z5AZK3t4zjOpJQ6BPECfiKAcqRUzkFmASQEhHzJOUgQ8BWyviwFsL4sBnC+LAE84YMWQnSAVCixdkvMAiB6Q7TCfJtrLq4PHkmSnHHbi0LHvOYa6w/g3kitjSgOYFyUUoWvlCPA9C1gvQfgDmiHNLZBgO8A3geZt+G6chQBA7hi/0QVQBrZ9EwQ0LbtbhgGghQAVFPAB25HmRH8b2/nAAAAAElFTkSuQmCC';

      HoverTool.prototype.initialize = function(attrs, options) {
        var renderers;
        HoverTool.__super__.initialize.call(this, attrs, options);
        this.set('tooltip', new Tooltip.Model());
        renderers = this.get('plot').get('renderers');
        renderers.push(this.get('tooltip'));
        return this.get('plot').set('renderers', renderers);
      };

      HoverTool.prototype.defaults = function() {
        return _.extend({}, HoverTool.__super__.defaults.call(this), {
          snap_to_marker: true,
          tooltips: {
            "index": "$index",
            "data (x, y)": "($x, $y)",
            "canvas (x, y)": "($sx, $sy)"
          }
        });
      };

      return HoverTool;

    })(InspectTool.Model);
    HoverTools = (function(_super) {
      __extends(HoverTools, _super);

      function HoverTools() {
        _ref2 = HoverTools.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      HoverTools.prototype.model = HoverTool;

      return HoverTools;

    })(Collection);
    return {
      "Model": HoverTool,
      "Collection": new HoverTools(),
      "View": HoverToolView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=hover_tool.js.map
*/