(function() {
  define(["underscore", "jquery", "./logging", "./plot", "range/data_range1d", "range/factor_range", "range/range1d", "renderer/annotation/legend", "renderer/glyph/glyph_renderer", "renderer/guide/categorical_axis", "renderer/guide/linear_axis", "renderer/guide/grid", "renderer/overlay/box_selection", "source/column_data_source", "tool/gestures/box_select_tool", "tool/gestures/box_zoom_tool", "tool/inspectors/hover_tool", "tool/gestures/pan_tool", "tool/actions/preview_save_tool", "tool/gestures/resize_tool", "tool/gestures/wheel_zoom_tool", "tool/actions/reset_tool", "renderer/guide/datetime_axis"], function(_, $, Logging, Plot, DataRange1d, FactorRange, Range1d, Legend, GlyphRenderer, CategoricalAxis, LinearAxis, Grid, BoxSelection, ColumnDataSource, BoxSelectTool, BoxZoomTool, HoverTool, PanTool, PreviewSaveTool, ResizeTool, WheelZoomTool, ResetTool, DatetimeAxis) {
    var add_axes, add_grids, add_legend, add_tools, create_glyphs, create_range, create_sources, logger, make_plot, show;
    logger = Logging.logger;
    create_sources = function(data) {
      var d, sources, _i, _len;
      if (!_.isArray(data)) {
        data = [data];
      }
      sources = [];
      for (_i = 0, _len = data.length; _i < _len; _i++) {
        d = data[_i];
        if (d instanceof ColumnDataSource.Model) {
          sources.push(d);
        } else {
          sources.push(ColumnDataSource.Collection.create({
            data: d
          }));
        }
      }
      return sources;
    };
    create_range = function(range, sources, columns) {
      var s;
      if (range === 'auto') {
        return DataRange1d.Collection.create({
          sources: (function() {
            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = sources.length; _i < _len; _i++) {
              s = sources[_i];
              _results.push({
                source: s,
                columns: columns
              });
            }
            return _results;
          })()
        });
      } else if ((range instanceof Range1d.Model) || (range instanceof FactorRange.Model)) {
        return range;
      } else {
        if (typeof range[0] === "string") {
          return FactorRange.Collection.create({
            factors: range
          });
        } else {
          return Range1d.Collection.create({
            start: range[0],
            end: range[1]
          });
        }
      }
    };
    create_glyphs = function(plot, glyphspecs, sources, nonselection_glyphspecs) {
      var glyph, glyphs, non_spec, source, spec, val, x, _i, _len, _ref;
      glyphs = [];
      if (!_.isArray(glyphspecs)) {
        glyphspecs = [glyphspecs];
      }
      if (sources.length === 1) {
        sources = (function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = glyphspecs.length; _i < _len; _i++) {
            x = glyphspecs[_i];
            _results.push(sources[0]);
          }
          return _results;
        })();
      }
      if (nonselection_glyphspecs == null) {
        nonselection_glyphspecs = {
          fill_alpha: 0.1,
          line_alpha: 0.1
        };
      }
      if (!_.isArray(nonselection_glyphspecs)) {
        nonselection_glyphspecs = (function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = glyphspecs.length; _i < _len; _i++) {
            x = glyphspecs[_i];
            _results.push(nonselection_glyphspecs);
          }
          return _results;
        })();
      }
      _ref = _.zip(glyphspecs, nonselection_glyphspecs, sources);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        val = _ref[_i];
        spec = val[0], non_spec = val[1], source = val[2];
        glyph = GlyphRenderer.Collection.create({
          data_source: source,
          glyph: spec,
          nonselection_glyph: non_spec
        });
        glyphs.push(glyph);
      }
      return glyphs;
    };
    add_axes = function(plot, xaxes_spec, yaxes_spec, xdr, ydr) {
      var a, above, axis, below, left, loc, right, xax, xaxes, yax, yaxes, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _len5, _m, _n;
      xaxes = [];
      if (xaxes_spec) {
        if (xaxes_spec === true) {
          xaxes_spec = ['below', 'above'];
        }
        if (!_.isArray(xaxes_spec)) {
          xaxes_spec = [xaxes_spec];
        }
        if (xaxes_spec[0] === "datetime") {
          axis = DatetimeAxis.Collection.create({
            axis_label: 'x',
            location: 'below',
            plot: plot
          });
          xaxes.push(axis);
        } else if (xdr.type === "FactorRange") {
          for (_i = 0, _len = xaxes_spec.length; _i < _len; _i++) {
            loc = xaxes_spec[_i];
            axis = CategoricalAxis.Collection.create({
              axis_label: 'x',
              location: loc,
              plot: plot
            });
            xaxes.push(axis);
          }
        } else {
          for (_j = 0, _len1 = xaxes_spec.length; _j < _len1; _j++) {
            loc = xaxes_spec[_j];
            axis = LinearAxis.Collection.create({
              axis_label: 'x',
              location: loc,
              plot: plot
            });
            xaxes.push(axis);
          }
        }
        for (_k = 0, _len2 = xaxes.length; _k < _len2; _k++) {
          xax = xaxes[_k];
          if (xax.get('location') === "below") {
            below = plot.get('below');
            below.push(xax);
            plot.set('below', below);
          } else if (xax.get('location') === "above") {
            above = plot.get('above');
            above.push(xax);
            plot.set('above', above);
          }
        }
      }
      yaxes = [];
      if (yaxes_spec) {
        if (yaxes_spec === true) {
          yaxes_spec = ['left', 'right'];
        }
        if (!_.isArray(yaxes_spec)) {
          yaxes_spec = [yaxes_spec];
        }
        if (yaxes_spec[0] === "datetime") {
          axis = DatetimeAxis.Collection.create({
            axis_label: 'y',
            location: 'left',
            plot: plot
          });
          yaxes.push(axis);
        } else if (ydr.type === "FactorRange") {
          for (_l = 0, _len3 = yaxes_spec.length; _l < _len3; _l++) {
            loc = yaxes_spec[_l];
            axis = CategoricalAxis.Collection.create({
              axis_label: 'y',
              location: loc,
              plot: plot
            });
            yaxes.push(axis);
          }
        } else {
          for (_m = 0, _len4 = yaxes_spec.length; _m < _len4; _m++) {
            loc = yaxes_spec[_m];
            axis = LinearAxis.Collection.create({
              axis_label: 'y',
              location: loc,
              plot: plot
            });
            yaxes.push(axis);
          }
        }
        for (_n = 0, _len5 = yaxes.length; _n < _len5; _n++) {
          yax = yaxes[_n];
          if (yax.get('location') === "left") {
            left = plot.get('left');
            left.push(yax);
            plot.set('left', left);
          } else if (yax.get('location') === "right") {
            right = plot.get('right');
            right.push(yax);
            plot.set('right', right);
          }
        }
      }
      plot.add_renderers((function() {
        var _len6, _o, _results;
        _results = [];
        for (_o = 0, _len6 = xaxes.length; _o < _len6; _o++) {
          a = xaxes[_o];
          _results.push(a);
        }
        return _results;
      })());
      plot.add_renderers((function() {
        var _len6, _o, _results;
        _results = [];
        for (_o = 0, _len6 = yaxes.length; _o < _len6; _o++) {
          a = yaxes[_o];
          _results.push(a);
        }
        return _results;
      })());
      return [xaxes, yaxes];
    };
    add_grids = function(plot, xgrid, ygrid, xaxes, yaxes) {
      var g, grid, grids;
      grids = [];
      if (xgrid && xaxes.length > 0) {
        grid = Grid.Collection.create({
          dimension: 0,
          plot: plot,
          ticker: xaxes[0].get('ticker')
        });
        grids.push(grid);
      }
      if (ygrid && yaxes.length > 0) {
        grid = Grid.Collection.create({
          dimension: 1,
          plot: plot,
          ticker: yaxes[0].get('ticker')
        });
        grids.push(grid);
        return plot.add_renderers((function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = grids.length; _i < _len; _i++) {
            g = grids[_i];
            _results.push(g);
          }
          return _results;
        })());
      }
    };
    add_tools = function(plot, tools, glyphs, xdr, ydr) {
      var added_tools, box_zoom_overlay, box_zoom_tool, g, hover_tool, pan_tool, preview_tool, reset_tool, resize_tool, select_overlay, select_tool, wheel_zoom_tool;
      if (tools === false) {
        return;
      }
      if (tools === true) {
        tools = "pan,wheel_zoom,select,resize,preview,reset,box_zoom";
      }
      added_tools = [];
      if (tools.indexOf("pan") > -1) {
        pan_tool = PanTool.Collection.create({
          dataranges: [xdr, ydr],
          dimensions: ['width', 'height']
        });
        added_tools.push(pan_tool);
      }
      if (tools.indexOf("wheel_zoom") > -1) {
        wheel_zoom_tool = WheelZoomTool.Collection.create({
          dataranges: [xdr, ydr],
          dimensions: ['width', 'height']
        });
        added_tools.push(wheel_zoom_tool);
      }
      if (tools.indexOf("hover") > -1) {
        hover_tool = HoverTool.Collection.create({
          plot: plot
        });
        added_tools.push(hover_tool);
      }
      if (tools.indexOf("select") > -1) {
        select_tool = BoxSelectTool.Collection.create({
          renderers: (function() {
            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = glyphs.length; _i < _len; _i++) {
              g = glyphs[_i];
              _results.push(g);
            }
            return _results;
          })()
        });
        select_overlay = BoxSelection.Collection.create({
          tool: select_tool
        });
        added_tools.push(select_tool);
        plot.add_renderers([select_overlay]);
      }
      if (tools.indexOf("resize") > -1) {
        resize_tool = ResizeTool.Collection.create();
        added_tools.push(resize_tool);
      }
      if (tools.indexOf("preview") > -1) {
        preview_tool = PreviewSaveTool.Collection.create();
        added_tools.push(preview_tool);
      }
      if (tools.indexOf("reset") > -1) {
        reset_tool = ResetTool.Collection.create();
        added_tools.push(reset_tool);
      }
      if (tools.indexOf("box_zoom") > -1) {
        box_zoom_tool = BoxZoomTool.Collection.create();
        box_zoom_overlay = BoxSelection.Collection.create({
          tool: box_zoom_tool
        });
        added_tools.push(box_zoom_tool);
        plot.add_renderers([box_zoom_overlay]);
      }
      return plot.set_obj('tools', added_tools);
    };
    add_legend = function(plot, legend, glyphs) {
      var g, idx, legend_renderer, legends, _i, _len;
      if (legend) {
        legends = {};
        for (idx = _i = 0, _len = glyphs.length; _i < _len; idx = ++_i) {
          g = glyphs[idx];
          legends[legend + String(idx)] = [g];
        }
        legend_renderer = Legend.Collection.create({
          plot: plot,
          orientation: "top_right",
          legends: legends
        });
        return plot.add_renderers([legend_renderer]);
      }
    };
    make_plot = function(glyphspecs, data, _arg) {
      var dims, g, glyphs, legend, nonselected, plot, sources, title, tools, xaxes, xdr, xgrid, xrange, yaxes, ydr, ygrid, yrange, _ref;
      nonselected = _arg.nonselected, title = _arg.title, dims = _arg.dims, xrange = _arg.xrange, yrange = _arg.yrange, xaxes = _arg.xaxes, yaxes = _arg.yaxes, xgrid = _arg.xgrid, ygrid = _arg.ygrid, xdr = _arg.xdr, ydr = _arg.ydr, tools = _arg.tools, legend = _arg.legend;
      if (nonselected == null) {
        nonselected = null;
      }
      if (title == null) {
        title = "";
      }
      if (dims == null) {
        dims = [400, 400];
      }
      if (xrange == null) {
        xrange = 'auto';
      }
      if (yrange == null) {
        yrange = 'auto';
      }
      if (xaxes == null) {
        xaxes = true;
      }
      if (yaxes == null) {
        yaxes = true;
      }
      if (xgrid == null) {
        xgrid = true;
      }
      if (ygrid == null) {
        ygrid = true;
      }
      if (tools == null) {
        tools = true;
      }
      if (legend == null) {
        legend = false;
      }
      sources = create_sources(data);
      xdr = create_range(xrange, sources, ['x']);
      ydr = create_range(yrange, sources, ['y']);
      plot = Plot.Collection.create({
        x_range: xdr,
        y_range: ydr,
        plot_width: dims[0],
        plot_height: dims[1],
        title: title
      });
      glyphs = create_glyphs(plot, glyphspecs, sources, nonselected);
      plot.add_renderers((function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = glyphs.length; _i < _len; _i++) {
          g = glyphs[_i];
          _results.push(g);
        }
        return _results;
      })());
      _ref = add_axes(plot, xaxes, yaxes, xdr, ydr), xaxes = _ref[0], yaxes = _ref[1];
      add_grids(plot, xgrid, ygrid, xaxes, yaxes);
      add_tools(plot, tools, glyphs, xdr, ydr);
      add_legend(plot, legend, glyphs);
      return plot;
    };
    show = function(plot, target_div) {
      var div, myrender;
      if (target_div == null) {
        target_div = false;
      }
      div = $('<div class="plotdiv"></div>');
      if (target_div) {
        target_div = $(target_div);
      } else {
        target_div = $('body');
      }
      target_div.append(div);
      myrender = function() {
        var view;
        view = new plot.default_view({
          model: plot
        });
        window.pview = view;
        div.append(view.$el);
        return logger.info("added plot: " + (plot.get('title')));
      };
      return _.defer(myrender);
    };
    return {
      "make_plot": make_plot,
      "create_glyphs": create_glyphs,
      "show": show
    };
  });

}).call(this);

/*
//@ sourceMappingURL=plotting.js.map
*/