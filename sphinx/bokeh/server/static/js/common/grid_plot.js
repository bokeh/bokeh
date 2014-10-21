(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  define(["underscore", "backbone", "./build_views", "./continuum_view", "./collection", "./has_properties", "./logging", "./tool_manager", "./plot_template", "renderer/properties"], function(_, Backbone, build_views, ContinuumView, Collection, HasProperties, Logging, ToolManager, plot_template, Properties) {
    var GridPlot, GridPlotView, GridPlots, GridToolManager, GridViewState, logger, _ToolProxy, _ref, _ref1, _ref2, _ref3, _ref4, _ref5;
    logger = Logging.logger;
    _ToolProxy = (function(_super) {
      __extends(_ToolProxy, _super);

      function _ToolProxy() {
        _ref = _ToolProxy.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      _ToolProxy.prototype.attrs_and_props = function() {
        return this.attributes.tools[0].attrs_and_props();
      };

      _ToolProxy.prototype.get = function(attr) {
        return this.attributes.tools[0].get(attr);
      };

      _ToolProxy.prototype.set = function(attr, value) {
        var tool, _i, _len, _ref1, _results;
        _ToolProxy.__super__.set.call(this, attr, value);
        _ref1 = this.attributes.tools;
        _results = [];
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          tool = _ref1[_i];
          _results.push(tool.set(attr, value));
        }
        return _results;
      };

      return _ToolProxy;

    })(Backbone.Model);
    GridToolManager = (function(_super) {
      __extends(GridToolManager, _super);

      function GridToolManager() {
        this._active_change = __bind(this._active_change, this);
        _ref1 = GridToolManager.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      GridToolManager.prototype._init_tools = function() {
        var actions, et, gestures, info, inspectors, proxy, tm, tool, tools, typ, _i, _j, _k, _l, _len, _len1, _len2, _len3, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _results;
        inspectors = {};
        actions = {};
        gestures = {};
        _ref2 = this.get('tool_managers');
        for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
          tm = _ref2[_i];
          _ref3 = tm.get('gestures');
          for (et in _ref3) {
            info = _ref3[et];
            if (!(et in gestures)) {
              gestures[et] = {};
            }
            _ref4 = info.tools;
            for (_j = 0, _len1 = _ref4.length; _j < _len1; _j++) {
              tool = _ref4[_j];
              if (!(tool.type in gestures[et])) {
                gestures[et][tool.type] = [];
              }
              gestures[et][tool.type].push(tool);
            }
          }
          _ref5 = tm.get('inspectors');
          for (_k = 0, _len2 = _ref5.length; _k < _len2; _k++) {
            tool = _ref5[_k];
            if (!(tool.type in inspectors)) {
              inspectors[tool.type] = [];
            }
            inspectors[tool.type].push(tool);
          }
          _ref6 = this.get('actions');
          for (_l = 0, _len3 = _ref6.length; _l < _len3; _l++) {
            tool = _ref6[_l];
            if (!(tool.type in actions)) {
              actions[tool.type] = [];
            }
            actions[tool.type].push(tool);
          }
        }
        for (et in gestures) {
          _ref7 = gestures[et];
          for (typ in _ref7) {
            tools = _ref7[typ];
            if (tools.length !== this.get('num_plots')) {
              continue;
            }
            proxy = new _ToolProxy({
              tools: tools
            });
            this.get('gestures')[et].tools.push(proxy);
            this.listenTo(proxy, 'change:active', _.bind(this._active_change, proxy));
          }
        }
        for (typ in actions) {
          tools = actions[typ];
          if (tools.length !== this.get('num_plots')) {
            continue;
          }
          proxy = new _ToolProxy({
            tools: tools
          });
          this.get('actions').tools.push(proxy);
        }
        for (typ in inspectors) {
          tools = inspectors[typ];
          if (tools.length !== this.get('num_plots')) {
            continue;
          }
          proxy = new _ToolProxy({
            tools: tools
          });
          this.get('inspectors').tools.push(proxy);
        }
        _ref8 = this.get('gestures');
        _results = [];
        for (et in _ref8) {
          info = _ref8[et];
          tools = info.tools;
          if (tools.length === 0) {
            continue;
          }
          info.tools = _.sortBy(tools, function(tool) {
            return tool.get('default_order');
          });
          _results.push(info.tools[0].set('active', true));
        }
        return _results;
      };

      GridToolManager.prototype._active_change = function(tool) {
        var active, et, gestures, prev;
        et = tool.get('event_type');
        active = tool.get('active');
        if (!active) {
          return null;
        }
        gestures = this.get('gestures');
        prev = gestures[et].active;
        if (prev != null) {
          logger.debug("GridToolManager: deactivating tool: " + prev.type + " (for event type '" + et + "'");
          prev.set('active', false);
        }
        gestures[et].active = tool;
        this.set('gestures', gestures);
        logger.debug("GridToolManager: activating tool: " + tool.type + " (for event type '" + et + "'");
        return null;
      };

      GridToolManager.prototype.defaults = function() {
        return _.extend({}, GridToolManager.__super__.defaults.call(this), {
          tool_manangers: []
        });
      };

      return GridToolManager;

    })(ToolManager.Model);
    GridViewState = (function(_super) {
      __extends(GridViewState, _super);

      function GridViewState() {
        this.layout_widths = __bind(this.layout_widths, this);
        this.layout_heights = __bind(this.layout_heights, this);
        this.setup_layout_properties = __bind(this.setup_layout_properties, this);
        _ref2 = GridViewState.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      GridViewState.prototype.setup_layout_properties = function() {
        var row, viewstate, _i, _len, _ref3, _results;
        this.register_property('layout_heights', this.layout_heights, false);
        this.register_property('layout_widths', this.layout_widths, false);
        _ref3 = this.get('viewstates');
        _results = [];
        for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
          row = _ref3[_i];
          _results.push((function() {
            var _j, _len1, _results1;
            _results1 = [];
            for (_j = 0, _len1 = row.length; _j < _len1; _j++) {
              viewstate = row[_j];
              this.add_dependencies('layout_heights', viewstate, 'height');
              _results1.push(this.add_dependencies('layout_widths', viewstate, 'width'));
            }
            return _results1;
          }).call(this));
        }
        return _results;
      };

      GridViewState.prototype.initialize = function(attrs, options) {
        GridViewState.__super__.initialize.call(this, attrs, options);
        this.setup_layout_properties();
        this.listenTo(this, 'change:viewstates', this.setup_layout_properties);
        this.register_property('height', function() {
          return _.reduce(this.get('layout_heights'), (function(x, y) {
            return x + y;
          }), 0);
        }, false);
        this.add_dependencies('height', this, 'layout_heights');
        this.register_property('width', function() {
          return _.reduce(this.get('layout_widths'), (function(x, y) {
            return x + y;
          }), 0);
        }, false);
        return this.add_dependencies('width', this, 'layout_widths');
      };

      GridViewState.prototype.position_child_x = function(offset, childsize) {
        return offset;
      };

      GridViewState.prototype.position_child_y = function(offset, childsize) {
        return this.get('height') - offset - childsize;
      };

      GridViewState.prototype.maxdim = function(dim, row) {
        if (row.length === 0) {
          return 0;
        } else {
          return _.max(_.map(row, function(x) {
            if (x != null) {
              return x.get(dim);
            }
            return 0;
          }));
        }
      };

      GridViewState.prototype.layout_heights = function() {
        var row, row_heights;
        row_heights = (function() {
          var _i, _len, _ref3, _results;
          _ref3 = this.get('viewstates');
          _results = [];
          for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
            row = _ref3[_i];
            _results.push(this.maxdim('height', row));
          }
          return _results;
        }).call(this);
        return row_heights;
      };

      GridViewState.prototype.layout_widths = function() {
        var col, col_widths, columns, n, num_cols, row;
        num_cols = this.get('viewstates')[0].length;
        columns = (function() {
          var _i, _len, _ref3, _results;
          _ref3 = _.range(num_cols);
          _results = [];
          for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
            n = _ref3[_i];
            _results.push((function() {
              var _j, _len1, _ref4, _results1;
              _ref4 = this.get('viewstates');
              _results1 = [];
              for (_j = 0, _len1 = _ref4.length; _j < _len1; _j++) {
                row = _ref4[_j];
                _results1.push(row[n]);
              }
              return _results1;
            }).call(this));
          }
          return _results;
        }).call(this);
        col_widths = (function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = columns.length; _i < _len; _i++) {
            col = columns[_i];
            _results.push(this.maxdim('width', col));
          }
          return _results;
        }).call(this);
        return col_widths;
      };

      GridViewState.prototype.defaults = function() {
        return _.extend({}, GridViewState.__super__.defaults.call(this), {
          viewstates: [[]],
          border_space: 0
        });
      };

      return GridViewState;

    })(HasProperties);
    GridPlotView = (function(_super) {
      __extends(GridPlotView, _super);

      function GridPlotView() {
        _ref3 = GridPlotView.__super__.constructor.apply(this, arguments);
        return _ref3;
      }

      GridPlotView.prototype.className = "";

      GridPlotView.prototype.template = plot_template;

      GridPlotView.prototype.initialize = function(options) {
        GridPlotView.__super__.initialize.call(this, options);
        this.viewstate = new GridViewState();
        this.child_views = {};
        this.build_children();
        this.bind_bokeh_events();
        this.$el.html(this.template());
        this.render();
        return this;
      };

      GridPlotView.prototype.bind_bokeh_events = function() {
        this.listenTo(this.model, 'change:children', this.build_children);
        this.listenTo(this.model, 'change', this.render);
        this.listenTo(this.viewstate, 'change', this.render);
        return this.listenTo(this.model, 'destroy', this.remove);
      };

      GridPlotView.prototype.build_children = function() {
        var childmodels, plot, row, viewstates, vsrow, x, _i, _j, _k, _l, _len, _len1, _len2, _len3, _ref4, _ref5, _ref6, _results;
        childmodels = [];
        _ref4 = this.mget('children');
        for (_i = 0, _len = _ref4.length; _i < _len; _i++) {
          row = _ref4[_i];
          for (_j = 0, _len1 = row.length; _j < _len1; _j++) {
            plot = row[_j];
            plot.set('toolbar_location', null);
            childmodels.push(plot);
          }
        }
        build_views(this.child_views, childmodels, {});
        viewstates = [];
        _ref5 = this.mget('children');
        for (_k = 0, _len2 = _ref5.length; _k < _len2; _k++) {
          row = _ref5[_k];
          vsrow = (function() {
            var _l, _len3, _results;
            _results = [];
            for (_l = 0, _len3 = row.length; _l < _len3; _l++) {
              x = row[_l];
              _results.push(this.child_views[x.id].canvas);
            }
            return _results;
          }).call(this);
          viewstates.push(vsrow);
        }
        this.viewstate.set('viewstates', viewstates);
        _ref6 = this.mget('children');
        _results = [];
        for (_l = 0, _len3 = _ref6.length; _l < _len3; _l++) {
          row = _ref6[_l];
          _results.push((function() {
            var _len4, _m, _results1;
            _results1 = [];
            for (_m = 0, _len4 = row.length; _m < _len4; _m++) {
              plot = row[_m];
              _results1.push(this.listenTo(plot.solver, 'layout_update', this.render));
            }
            return _results1;
          }).call(this));
        }
        return _results;
      };

      GridPlotView.prototype.render = function() {
        var add, cidx, col_widths, div, height, last_plot, plot_divs, plot_wrapper, plotspec, ridx, row, row_heights, toolbar_location, toolbar_selector, total_height, view, width, x_coords, xpos, y_coords, ypos, _i, _j, _k, _len, _len1, _len2, _ref4, _ref5;
        GridPlotView.__super__.render.call(this);
        _ref4 = _.values(this.child_views);
        for (_i = 0, _len = _ref4.length; _i < _len; _i++) {
          view = _ref4[_i];
          view.$el.detach();
        }
        div = $('<div />');
        this.$('.bk-plot-canvas-wrapper').empty();
        this.$('.bk-plot-canvas-wrapper').append(div);
        toolbar_location = this.mget('toolbar_location');
        if (toolbar_location != null) {
          toolbar_selector = '.bk-plot-' + toolbar_location;
          this.tm_view = new ToolManager.View({
            model: this.mget('tool_manager'),
            el: this.$(toolbar_selector)
          });
          this.tm_view.render();
        }
        row_heights = this.viewstate.get('layout_heights');
        col_widths = this.viewstate.get('layout_widths');
        y_coords = [0];
        _.reduceRight(row_heights.slice(1), function(x, y) {
          var val;
          val = x + y;
          y_coords.push(val);
          return val;
        }, 0);
        y_coords.reverse();
        x_coords = [0];
        _.reduce(col_widths.slice(0), function(x, y) {
          var val;
          val = x + y;
          x_coords.push(val);
          return val;
        }, 0);
        plot_divs = [];
        last_plot = null;
        _ref5 = this.mget('children');
        for (ridx = _j = 0, _len1 = _ref5.length; _j < _len1; ridx = ++_j) {
          row = _ref5[ridx];
          for (cidx = _k = 0, _len2 = row.length; _k < _len2; cidx = ++_k) {
            plotspec = row[cidx];
            view = this.child_views[plotspec.id];
            ypos = this.viewstate.position_child_y(y_coords[ridx], view.canvas.get('height'));
            xpos = this.viewstate.position_child_x(x_coords[cidx], view.canvas.get('width'));
            plot_wrapper = $("<div class='gp_plotwrapper'></div>");
            plot_wrapper.attr('style', "position: absolute; left:" + xpos + "px; top:" + ypos + "px");
            plot_wrapper.append(view.$el);
            div.append(plot_wrapper);
          }
        }
        add = function(a, b) {
          return a + b;
        };
        total_height = _.reduce(row_heights, add, 0);
        height = total_height;
        width = _.reduce(col_widths, add, 0);
        return div.attr('style', "position:relative; height:" + height + "px;width:" + width + "px");
      };

      return GridPlotView;

    })(ContinuumView);
    GridPlot = (function(_super) {
      __extends(GridPlot, _super);

      function GridPlot() {
        _ref4 = GridPlot.__super__.constructor.apply(this, arguments);
        return _ref4;
      }

      GridPlot.prototype.type = 'GridPlot';

      GridPlot.prototype.default_view = GridPlotView;

      GridPlot.prototype.initialize = function(attrs, options) {
        GridPlot.__super__.initialize.call(this, attrs, options);
        return this.register_property('tool_manager', function() {
          var plot;
          return new GridToolManager({
            tool_managers: (function() {
              var _i, _len, _ref5, _results;
              _ref5 = _.flatten(this.get('children'));
              _results = [];
              for (_i = 0, _len = _ref5.length; _i < _len; _i++) {
                plot = _ref5[_i];
                _results.push(plot.get('tool_manager'));
              }
              return _results;
            }).call(this),
            toolbar_location: this.get('toolbar_location'),
            num_plots: _.flatten(this.get('children')).length
          });
        }, true);
      };

      GridPlot.prototype.defaults = function() {
        return _.extend({}, GridPlot.__super__.defaults.call(this), {
          children: [[]],
          toolbar_location: "left"
        });
      };

      return GridPlot;

    })(HasProperties);
    GridPlots = (function(_super) {
      __extends(GridPlots, _super);

      function GridPlots() {
        _ref5 = GridPlots.__super__.constructor.apply(this, arguments);
        return _ref5;
      }

      GridPlots.prototype.model = GridPlot;

      return GridPlots;

    })(Collection);
    return {
      "Model": GridPlot,
      "Collection": new GridPlots(),
      "View": GridPlotView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=grid_plot.js.map
*/