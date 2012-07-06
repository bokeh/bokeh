(function() {
  var BarRenderer, BarRendererView, BarRenderers, Bokeh, BokehView, Collections, Component, D3LinearAxes, D3LinearAxis, D3LinearAxisView, DataFactorRange, DataFactorRanges, DataRange1d, DataRange1ds, DiscreteColorMapper, DiscreteColorMappers, FactorRange, FactorRanges, GridPlotContainer, GridPlotContainerView, GridPlotContainers, HasProperties, LineRenderer, LineRendererView, LineRenderers, LinearMapper, LinearMappers, Mapper, ObjectArrayDataSource, ObjectArrayDataSources, OverlayView, PanTool, PanToolView, PanTools, Plot, PlotView, PlotWidget, Plots, Range1d, Range1ds, ScatterRenderer, ScatterRendererView, ScatterRenderers, ScatterSelectionOverlay, ScatterSelectionOverlayView, ScatterSelectionOverlays, SelectionTool, SelectionToolView, SelectionTools, XYRenderer, ZoomTool, ZoomToolView, ZoomTools, build_views, make_range_and_mapper, safebind,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; },
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  if (this.Bokeh) {
    Bokeh = this.Bokeh;
  } else {
    Bokeh = {};
    this.Bokeh = Bokeh;
  }

  Collections = Continuum.Collections;

  Bokeh.register_collection = function(key, value) {
    Collections[key] = value;
    return value.bokeh_key = key;
  };

  safebind = Continuum.safebind;

  Component = Continuum.Component;

  BokehView = Continuum.ContinuumView;

  HasProperties = Continuum.HasProperties;

  PlotWidget = (function(_super) {

    __extends(PlotWidget, _super);

    function PlotWidget() {
      PlotWidget.__super__.constructor.apply(this, arguments);
    }

    PlotWidget.prototype.initialize = function(options) {
      PlotWidget.__super__.initialize.call(this, options);
      this.plot_id = options.plot_id;
      return this.plot_model = options.plot_model;
    };

    return PlotWidget;

  })(Continuum.DeferredView);

  XYRenderer = (function(_super) {

    __extends(XYRenderer, _super);

    function XYRenderer() {
      XYRenderer.__super__.constructor.apply(this, arguments);
    }

    XYRenderer.prototype.select = function(xscreenbounds, yscreenbounds) {
      var func, mapper, source, xdatabounds, ydatabounds;
      if (xscreenbounds) {
        mapper = this.get_ref('xmapper');
        xdatabounds = [mapper.map_data(xscreenbounds[0]), mapper.map_data(xscreenbounds[1])];
      } else {
        xdatabounds = null;
      }
      if (yscreenbounds) {
        mapper = this.get_ref('ymapper');
        ydatabounds = [mapper.map_data(yscreenbounds[0]), mapper.map_data(yscreenbounds[1])];
      } else {
        ydatabounds = null;
      }
      func = function(xval, yval) {
        var val;
        val = ((xdatabounds === null) || (xval > xdatabounds[0] && xval < xdatabounds[1])) && ((ydatabounds === null) || (yval > ydatabounds[0] && yval < ydatabounds[1]));
        return val;
      };
      source = this.get_ref('data_source');
      return source.select([this.get('xfield'), this.get('yfield')], func);
    };

    return XYRenderer;

  })(Component);

  XYRenderer.prototype.defaults = _.clone(XYRenderer.prototype.defaults);

  _.extend(XYRenderer.prototype.defaults, {
    xmapper: null,
    ymapper: null,
    xfield: null,
    yfield: null,
    data_source: null
  });

  Range1d = (function(_super) {

    __extends(Range1d, _super);

    function Range1d() {
      Range1d.__super__.constructor.apply(this, arguments);
    }

    Range1d.prototype.type = 'Range1d';

    return Range1d;

  })(HasProperties);

  Range1d.prototype.defaults = _.clone(Range1d.prototype.defaults);

  _.extend(Range1d.prototype.defaults, {
    start: 0,
    end: 1
  });

  Range1ds = (function(_super) {

    __extends(Range1ds, _super);

    function Range1ds() {
      Range1ds.__super__.constructor.apply(this, arguments);
    }

    Range1ds.prototype.model = Range1d;

    return Range1ds;

  })(Continuum.Collection);

  DataRange1d = (function(_super) {

    __extends(DataRange1d, _super);

    function DataRange1d() {
      DataRange1d.__super__.constructor.apply(this, arguments);
    }

    DataRange1d.prototype.type = 'DataRange1d';

    DataRange1d.prototype._get_minmax = function() {
      var center, colname, columns, max, min, source, sourceobj, span, _i, _j, _len, _len2, _ref, _ref2, _ref3, _ref4;
      columns = [];
      _ref = this.get('sources');
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        source = _ref[_i];
        sourceobj = this.resolve_ref(source['ref']);
        _ref2 = source['columns'];
        for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
          colname = _ref2[_j];
          columns.push(sourceobj.getcolumn(colname));
        }
      }
      columns = _.reduce(columns, function(x, y) {
        return x.concat(y);
      });
      _ref3 = [_.min(columns), _.max(columns)], min = _ref3[0], max = _ref3[1];
      span = (max - min) * (1 + this.get('rangepadding'));
      center = (max + min) / 2.0;
      _ref4 = [center - span / 2.0, center + span / 2.0], min = _ref4[0], max = _ref4[1];
      return [min, max];
    };

    DataRange1d.prototype._get_start = function() {
      if (!_.isNullOrUndefined(this.get('_start'))) {
        return this.get('_start');
      } else {
        return this.get('minmax')[0];
      }
    };

    DataRange1d.prototype._set_start = function(start) {
      return this.set('_start', start);
    };

    DataRange1d.prototype._get_end = function() {
      if (!_.isNullOrUndefined(this.get('_end'))) {
        return this.get('_end');
      } else {
        return this.get('minmax')[1];
      }
    };

    DataRange1d.prototype._set_end = function(end) {
      return this.set('_end', end);
    };

    DataRange1d.prototype.dinitialize = function(attrs, options) {
      var deps, source, _i, _len, _ref;
      DataRange1d.__super__.dinitialize.call(this, attrs, options);
      deps = ['sources', 'rangepadding'];
      _ref = this.get('sources');
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        source = _ref[_i];
        deps.push({
          'ref': source['ref'],
          'fields': ['data']
        });
      }
      this.register_property('minmax', deps, this._get_minmax, true);
      this.register_property('start', ['minmax', '_start'], this._get_start, true, this._set_start);
      return this.register_property('end', ['minmax', '_end'], this._get_end, true, this._set_end);
    };

    return DataRange1d;

  })(Range1d);

  DataRange1d.prototype.defaults = _.clone(DataRange1d.prototype.defaults);

  _.extend(DataRange1d.prototype.defaults, {
    sources: [],
    rangepadding: 0.1
  });

  DataRange1ds = (function(_super) {

    __extends(DataRange1ds, _super);

    function DataRange1ds() {
      DataRange1ds.__super__.constructor.apply(this, arguments);
    }

    DataRange1ds.prototype.model = DataRange1d;

    return DataRange1ds;

  })(Continuum.Collection);

  Range1ds = (function(_super) {

    __extends(Range1ds, _super);

    function Range1ds() {
      Range1ds.__super__.constructor.apply(this, arguments);
    }

    Range1ds.prototype.model = Range1d;

    return Range1ds;

  })(Continuum.Collection);

  FactorRange = (function(_super) {

    __extends(FactorRange, _super);

    function FactorRange() {
      FactorRange.__super__.constructor.apply(this, arguments);
    }

    FactorRange.prototype.type = 'FactorRange';

    return FactorRange;

  })(HasProperties);

  FactorRange.prototype.defaults = _.clone(FactorRange.prototype.defaults);

  _.extend(FactorRange.prototype.defaults, {
    values: []
  });

  DataFactorRange = (function(_super) {

    __extends(DataFactorRange, _super);

    function DataFactorRange() {
      DataFactorRange.__super__.constructor.apply(this, arguments);
    }

    DataFactorRange.prototype.type = 'DataFactorRange';

    DataFactorRange.prototype.dinitialize = function(attrs, options) {
      DataFactorRange.__super__.dinitialize.call(this, attrs, options);
      return this.register_property('values', [
        'data_source', 'columns', {
          ref: this.get('data_source'),
          fields: ['data']
        }
      ], function() {
        var columns, temp, uniques, val, x, _i, _len;
        columns = (function() {
          var _i, _len, _ref, _results;
          _ref = this.get('columns');
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            x = _ref[_i];
            _results.push(this.get_ref('data_source').getcolumn(x));
          }
          return _results;
        }).call(this);
        columns = _.reduce(columns, function(x, y) {
          return x.concat(y);
        });
        temp = {};
        for (_i = 0, _len = columns.length; _i < _len; _i++) {
          val = columns[_i];
          temp[val] = true;
        }
        uniques = _.keys(temp);
        uniques = _.sortBy(uniques, (function(x) {
          return x;
        }));
        return uniques;
      }, true);
    };

    return DataFactorRange;

  })(FactorRange);

  DataFactorRange.prototype.defaults = _.clone(DataFactorRange.prototype.defaults);

  _.extend(DataFactorRange.prototype.defaults, {
    values: [],
    columns: [],
    data_source: null
  });

  DataFactorRanges = (function(_super) {

    __extends(DataFactorRanges, _super);

    function DataFactorRanges() {
      DataFactorRanges.__super__.constructor.apply(this, arguments);
    }

    DataFactorRanges.prototype.model = DataFactorRange;

    return DataFactorRanges;

  })(Continuum.Collection);

  FactorRanges = (function(_super) {

    __extends(FactorRanges, _super);

    function FactorRanges() {
      FactorRanges.__super__.constructor.apply(this, arguments);
    }

    FactorRanges.prototype.model = FactorRange;

    return FactorRanges;

  })(Continuum.Collection);

  Mapper = (function(_super) {

    __extends(Mapper, _super);

    function Mapper() {
      Mapper.__super__.constructor.apply(this, arguments);
    }

    Mapper.prototype.type = 'Mapper';

    Mapper.prototype.map_screen = function(data) {};

    return Mapper;

  })(HasProperties);

  LinearMapper = (function(_super) {

    __extends(LinearMapper, _super);

    function LinearMapper() {
      LinearMapper.__super__.constructor.apply(this, arguments);
    }

    LinearMapper.prototype.type = 'LinearMapper';

    LinearMapper.prototype.calc_scale = function() {
      var domain, range;
      domain = [this.get_ref('data_range').get('start'), this.get_ref('data_range').get('end')];
      range = [this.get_ref('screen_range').get('start'), this.get_ref('screen_range').get('end')];
      return d3.scale.linear().domain(domain).range(range);
    };

    LinearMapper.prototype.dinitialize = function(attrs, options) {
      LinearMapper.__super__.dinitialize.call(this, attrs, options);
      this.register_property('scale', [
        'data_range', 'screen_range', {
          ref: this.get_ref('data_range'),
          fields: ['start', 'end']
        }, {
          ref: this.get_ref('screen_range'),
          fields: ['start', 'end']
        }
      ], function() {
        return this.calc_scale();
      }, true);
      return this.register_property('scale_factor', ['scale'], this._scale_factor, true);
    };

    LinearMapper.prototype._scale_factor = function() {
      var domain, domain_width, range, range_width;
      range = this.get('scale').range();
      range_width = range[1] - range[0];
      domain = this.get('scale').domain();
      domain_width = domain[1] - domain[0];
      return range_width / domain_width;
    };

    LinearMapper.prototype.map_screen = function(data) {
      return this.get('scale')(data);
    };

    LinearMapper.prototype.map_data = function(screen) {
      return this.get('scale').invert(screen);
    };

    return LinearMapper;

  })(Mapper);

  LinearMapper.prototype.defaults = _.clone(LinearMapper.prototype.defaults);

  _.extend(LinearMapper.prototype.defaults, {
    data_range: null,
    screen_range: null
  });

  LinearMappers = (function(_super) {

    __extends(LinearMappers, _super);

    function LinearMappers() {
      LinearMappers.__super__.constructor.apply(this, arguments);
    }

    LinearMappers.prototype.model = LinearMapper;

    return LinearMappers;

  })(Continuum.Collection);

  DiscreteColorMapper = (function(_super) {

    __extends(DiscreteColorMapper, _super);

    function DiscreteColorMapper() {
      DiscreteColorMapper.__super__.constructor.apply(this, arguments);
    }

    DiscreteColorMapper.prototype.type = 'DiscreteColorMapper';

    DiscreteColorMapper.prototype.dinitialize = function(attrs, options) {
      DiscreteColorMapper.__super__.dinitialize.call(this, attrs, options);
      this.register_property('factor_map', ['data_range'], function() {
        var domain_map, index, val, _len, _ref;
        domain_map = {};
        _ref = this.get('data_range').get('values');
        for (index = 0, _len = _ref.length; index < _len; index++) {
          val = _ref[index];
          domain_map[val] = index;
        }
        return domain_map;
      }, true);
      return this.register_property('scale', ['colors', 'factor_map'], function() {
        return d3.scale.ordinal().domain(_.values(this.get('factor_map'))).range(this.get('colors'));
      }, true);
    };

    DiscreteColorMapper.prototype.map_screen = function(data) {
      return this.get('scale')(this.get('factor_map')[data]);
    };

    return DiscreteColorMapper;

  })(HasProperties);

  DiscreteColorMapper.prototype.defaults = _.clone(DiscreteColorMapper.prototype.defaults);

  _.extend(DiscreteColorMapper.prototype.defaults, {
    colors: ["#1f77b4", "#aec7e8", "#ff7f0e", "#ffbb78", "#2ca02c", "#98df8a", "#d62728", "#ff9896", "#9467bd", "#c5b0d5", "#8c564b", "#c49c94", "#e377c2", "#f7b6d2", "#7f7f7f", "#c7c7c7", "#bcbd22", "#dbdb8d", "#17becf", "#9edae5"],
    data_range: null
  });

  DiscreteColorMappers = (function(_super) {

    __extends(DiscreteColorMappers, _super);

    function DiscreteColorMappers() {
      DiscreteColorMappers.__super__.constructor.apply(this, arguments);
    }

    DiscreteColorMappers.prototype.model = DiscreteColorMapper;

    return DiscreteColorMappers;

  })(Continuum.Collection);

  ObjectArrayDataSource = (function(_super) {

    __extends(ObjectArrayDataSource, _super);

    function ObjectArrayDataSource() {
      ObjectArrayDataSource.__super__.constructor.apply(this, arguments);
    }

    ObjectArrayDataSource.prototype.type = 'ObjectArrayDataSource';

    ObjectArrayDataSource.prototype.initialize = function(attrs, options) {
      ObjectArrayDataSource.__super__.initialize.call(this, attrs, options);
      this.cont_ranges = {};
      return this.discrete_ranges = {};
    };

    ObjectArrayDataSource.prototype.getcolumn = function(colname) {
      var x;
      return (function() {
        var _i, _len, _ref, _results;
        _ref = this.get('data');
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          x = _ref[_i];
          _results.push(x[colname]);
        }
        return _results;
      }).call(this);
    };

    ObjectArrayDataSource.prototype.compute_cont_range = function(field) {
      var max, min, x;
      max = _.max((function() {
        var _i, _len, _ref, _results;
        _ref = this.get('data');
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          x = _ref[_i];
          _results.push(x[field]);
        }
        return _results;
      }).call(this));
      min = _.min((function() {
        var _i, _len, _ref, _results;
        _ref = this.get('data');
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          x = _ref[_i];
          _results.push(x[field]);
        }
        return _results;
      }).call(this));
      return [min, max];
    };

    ObjectArrayDataSource.prototype.compute_discrete_factor = function(field) {
      var temp, uniques, val, x, _i, _len, _ref;
      temp = {};
      _ref = (function() {
        var _j, _len, _ref, _results;
        _ref = this.get('data');
        _results = [];
        for (_j = 0, _len = _ref.length; _j < _len; _j++) {
          x = _ref[_j];
          _results.push(x[field]);
        }
        return _results;
      }).call(this);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        val = _ref[_i];
        temp[val] = true;
      }
      uniques = _.keys(temp);
      return uniques = _.sortBy(uniques, (function(x) {
        return x;
      }));
    };

    ObjectArrayDataSource.prototype.get_cont_range = function(field, padding) {
      var center, max, min, span, _ref, _ref2,
        _this = this;
      if (_.isUndefined(padding)) padding = 1.0;
      if (!_.has(this.cont_ranges, field)) {
        _ref = this.compute_cont_range(field), min = _ref[0], max = _ref[1];
        span = (max - min) * (1 + padding);
        center = (max + min) / 2.0;
        _ref2 = [center - span / 2.0, center + span / 2.0], min = _ref2[0], max = _ref2[1];
        this.cont_ranges[field] = Collections['Range1d'].create({
          start: min,
          end: max
        });
        this.on('change:data', function() {
          var _ref3;
          _ref3 = _this.compute_cont_range(field), max = _ref3[0], min = _ref3[1];
          _this.cont_ranges[field].set('start', min);
          return _this.cont_ranges[field].set('end', max);
        });
      }
      return this.cont_ranges[field];
    };

    ObjectArrayDataSource.prototype.get_discrete_range = function(field) {
      var factors,
        _this = this;
      if (!_.has(this.discrete_ranges, field)) {
        factors = this.compute_discrete_factor(field);
        this.discrete_ranges[field] = Collections['FactorRange'].create({
          values: factors
        });
        this.on('change:data', function() {
          factors = _this.compute_discrete_factor(field);
          return _this.discrete_ranges[field] = Collections['FactorRange'].set('values', factors);
        });
      }
      return this.discrete_ranges[field];
    };

    ObjectArrayDataSource.prototype.select = function(fields, func) {
      var args, idx, selected, val, x, _len, _ref;
      selected = [];
      _ref = this.get('data');
      for (idx = 0, _len = _ref.length; idx < _len; idx++) {
        val = _ref[idx];
        args = (function() {
          var _i, _len2, _results;
          _results = [];
          for (_i = 0, _len2 = fields.length; _i < _len2; _i++) {
            x = fields[_i];
            _results.push(val[x]);
          }
          return _results;
        })();
        if (func.apply(func, args)) selected.push(idx);
      }
      selected.sort();
      return selected;
    };

    return ObjectArrayDataSource;

  })(HasProperties);

  ObjectArrayDataSource.prototype.defaults = _.clone(ObjectArrayDataSource.prototype.defaults);

  _.extend(ObjectArrayDataSource.prototype.defaults, {
    data: [{}],
    name: 'data',
    selected: [],
    selecting: false
  });

  ObjectArrayDataSources = (function(_super) {

    __extends(ObjectArrayDataSources, _super);

    function ObjectArrayDataSources() {
      ObjectArrayDataSources.__super__.constructor.apply(this, arguments);
    }

    ObjectArrayDataSources.prototype.model = ObjectArrayDataSource;

    return ObjectArrayDataSources;

  })(Continuum.Collection);

  GridPlotContainerView = (function(_super) {

    __extends(GridPlotContainerView, _super);

    function GridPlotContainerView() {
      GridPlotContainerView.__super__.constructor.apply(this, arguments);
    }

    GridPlotContainerView.prototype.initialize = function(options) {
      var _this = this;
      GridPlotContainerView.__super__.initialize.call(this, options);
      this.childviews = {};
      this.build_children();
      this.request_render();
      safebind(this, this.model, 'change:children', this.build_children);
      safebind(this, this.model, 'change', this.request_render);
      safebind(this, this.model, 'destroy', function() {
        return _this.remove();
      });
      return this;
    };

    GridPlotContainerView.prototype.build_children = function() {
      var childspecs, node, row, x, _i, _j, _len, _len2, _ref;
      node = this.build_node();
      childspecs = [];
      _ref = this.mget('children');
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        row = _ref[_i];
        for (_j = 0, _len2 = row.length; _j < _len2; _j++) {
          x = row[_j];
          this.model.resolve_ref(x).set('usedialog', false);
          childspecs.push(x);
        }
      }
      return build_views(this.model, this.childviews, childspecs, {
        'el': this.tag_d3('plot')[0][0]
      });
    };

    GridPlotContainerView.prototype.build_node = function() {
      var node;
      node = this.tag_d3('mainsvg');
      if (node === null) {
        node = d3.select(this.el).append('svg').attr('id', this.tag_id('mainsvg'));
        node.append('g').attr('id', this.tag_id('plot'));
      }
      return node;
    };

    GridPlotContainerView.prototype.render_deferred_components = function(force) {
      var cidx, plotspec, ridx, row, _len, _ref, _results;
      GridPlotContainerView.__super__.render_deferred_components.call(this, force);
      _ref = this.mget('children');
      _results = [];
      for (ridx = 0, _len = _ref.length; ridx < _len; ridx++) {
        row = _ref[ridx];
        _results.push((function() {
          var _len2, _results2;
          _results2 = [];
          for (cidx = 0, _len2 = row.length; cidx < _len2; cidx++) {
            plotspec = row[cidx];
            _results2.push(this.childviews[plotspec.id].render_deferred_components(force));
          }
          return _results2;
        }).call(this));
      }
      return _results;
    };

    GridPlotContainerView.prototype.render = function() {
      var cidx, col_widths, node, plot, plotspec, ridx, row, row_heights, x_coords, y_coords, _len, _len2, _ref;
      GridPlotContainerView.__super__.render.call(this);
      node = this.build_node();
      this.tag_d3('plot').attr('transform', _.template('translate({{s}}, {{s}})', {
        's': this.mget('border_space')
      }));
      node.attr('width', this.mget('outerwidth')).attr('height', this.mget('outerheight')).attr('x', this.model.position_x()).attr('y', this.model.position_y());
      row_heights = this.model.layout_heights();
      col_widths = this.model.layout_widths();
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
      _ref = this.mget('children');
      for (ridx = 0, _len = _ref.length; ridx < _len; ridx++) {
        row = _ref[ridx];
        for (cidx = 0, _len2 = row.length; cidx < _len2; cidx++) {
          plotspec = row[cidx];
          plot = this.model.resolve_ref(plotspec);
          plot.set({
            offset: [x_coords[cidx], y_coords[ridx]],
            usedialog: false
          });
        }
      }
      if (this.mget('usedialog') && !this.$el.is(":visible")) {
        return this.add_dialog();
      }
    };

    return GridPlotContainerView;

  })(Continuum.DeferredParent);

  GridPlotContainer = (function(_super) {

    __extends(GridPlotContainer, _super);

    function GridPlotContainer() {
      this.maxdim = __bind(this.maxdim, this);
      GridPlotContainer.__super__.constructor.apply(this, arguments);
    }

    GridPlotContainer.prototype.type = 'GridPlotContainer';

    GridPlotContainer.prototype.default_view = GridPlotContainerView;

    GridPlotContainer.prototype.setup_layout_property = function() {
      var child, dependencies, row, _i, _j, _len, _len2, _ref;
      dependencies = [];
      _ref = this.get('children');
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        row = _ref[_i];
        for (_j = 0, _len2 = row.length; _j < _len2; _j++) {
          child = row[_j];
          dependencies.push({
            ref: child,
            fields: ['outerheight', 'outerwidth']
          });
        }
      }
      return this.register_property('layout', dependencies, function() {
        return [this.layout_heights(), this.layout_widths()];
      }, true);
    };

    GridPlotContainer.prototype.dinitialize = function(attrs, options) {
      GridPlotContainer.__super__.dinitialize.call(this, attrs, options);
      this.setup_layout_property();
      safebind(this, this, 'change:children', function() {
        this.remove_property('layout');
        this.setup_layout_property();
        return this.trigger('change:layout', this, this.get('layout'));
      });
      this.register_property('height', ['layout'], function() {
        return _.reduce(this.get('layout')[0], (function(x, y) {
          return x + y;
        }), 0);
      }, true);
      return this.register_property('width', ['layout'], function() {
        return _.reduce(this.get('layout')[1], (function(x, y) {
          return x + y;
        }), 0);
      }, true);
    };

    GridPlotContainer.prototype.maxdim = function(dim, row) {
      var x;
      if (row.length === 0) {
        return 0;
      } else {
        return _.max((function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = row.length; _i < _len; _i++) {
            x = row[_i];
            _results.push(this.resolve_ref(x).get(dim));
          }
          return _results;
        }).call(this));
      }
    };

    GridPlotContainer.prototype.layout_heights = function() {
      var row, row_heights;
      row_heights = (function() {
        var _i, _len, _ref, _results;
        _ref = this.get('children');
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          row = _ref[_i];
          _results.push(this.maxdim('outerheight', row));
        }
        return _results;
      }).call(this);
      return row_heights;
    };

    GridPlotContainer.prototype.layout_widths = function() {
      var col, col_widths, columns, maxdim, n, num_cols, row,
        _this = this;
      maxdim = function(dim, row) {
        var x;
        return _.max((function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = row.length; _i < _len; _i++) {
            x = row[_i];
            _results.push(this.resolve_ref(x).get(dim));
          }
          return _results;
        }).call(_this));
      };
      num_cols = this.get('children')[0].length;
      columns = (function() {
        var _i, _len, _ref, _results;
        _ref = _.range(num_cols);
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          n = _ref[_i];
          _results.push((function() {
            var _j, _len2, _ref2, _results2;
            _ref2 = this.get('children');
            _results2 = [];
            for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
              row = _ref2[_j];
              _results2.push(row[n]);
            }
            return _results2;
          }).call(this));
        }
        return _results;
      }).call(this);
      col_widths = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = columns.length; _i < _len; _i++) {
          col = columns[_i];
          _results.push(this.maxdim('outerwidth', col));
        }
        return _results;
      }).call(this);
      return col_widths;
    };

    return GridPlotContainer;

  })(Component);

  GridPlotContainer.prototype.defaults = _.clone(GridPlotContainer.prototype.defaults);

  _.extend(GridPlotContainer.prototype.defaults, {
    resize_children: false,
    children: [[]],
    usedialog: false,
    border_space: 0
  });

  GridPlotContainers = (function(_super) {

    __extends(GridPlotContainers, _super);

    function GridPlotContainers() {
      GridPlotContainers.__super__.constructor.apply(this, arguments);
    }

    GridPlotContainers.prototype.model = GridPlotContainer;

    return GridPlotContainers;

  })(Continuum.Collection);

  PlotView = (function(_super) {

    __extends(PlotView, _super);

    function PlotView() {
      PlotView.__super__.constructor.apply(this, arguments);
    }

    PlotView.prototype.default_options = {
      scale: 1.0
    };

    PlotView.prototype.initialize = function(options) {
      var _this = this;
      PlotView.__super__.initialize.call(this, _.defaults(options, this.default_options));
      this.renderers = {};
      this.axes = {};
      this.tools = {};
      this.overlays = {};
      this.build_renderers();
      this.build_axes();
      this.build_tools();
      this.build_overlays();
      this.render();
      safebind(this, this.model, 'change:renderers', this.build_renderers);
      safebind(this, this.model, 'change:axes', this.build_axes);
      safebind(this, this.model, 'change:tools', this.build_tools);
      safebind(this, this.model, 'change', this.request_render);
      safebind(this, this.model, 'destroy', function() {
        return _this.remove();
      });
      return this;
    };

    PlotView.prototype.build_renderers = function() {
      return build_views(this.model, this.renderers, this.mget('renderers'), {
        el: this.el,
        plot_id: this.id,
        plot_model: this.model
      });
    };

    PlotView.prototype.build_axes = function() {
      return build_views(this.model, this.axes, this.mget('axes'), {
        el: this.el,
        plot_id: this.id,
        plot_model: this.model
      });
    };

    PlotView.prototype.build_tools = function() {
      return build_views(this.model, this.tools, this.mget('tools'), {
        el: this.el,
        plot_id: this.id,
        plot_model: this.model
      });
    };

    PlotView.prototype.build_overlays = function() {
      var overlay, overlays, overlayspec, renderer, x, _i, _j, _len, _len2, _ref;
      overlays = (function() {
        var _i, _len, _ref, _results;
        _ref = this.mget('overlays');
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          x = _ref[_i];
          _results.push(_.clone(x));
        }
        return _results;
      }).call(this);
      for (_i = 0, _len = overlays.length; _i < _len; _i++) {
        overlayspec = overlays[_i];
        overlay = this.model.resolve_ref(overlayspec);
        if (!overlayspec['options']) overlayspec['options'] = {};
        overlayspec['options']['renderer_ids'] = [];
        _ref = overlay.get('renderers');
        for (_j = 0, _len2 = _ref.length; _j < _len2; _j++) {
          renderer = _ref[_j];
          overlayspec['options']['renderer_ids'].push(this.renderers[renderer.id].id);
        }
      }
      return build_views(this.model, this.overlays, overlays, {
        el: this.el,
        plot_id: this.id,
        plot_model: this.model
      });
    };

    PlotView.prototype.bind_overlays = function() {
      var overlayspec, _i, _len, _ref, _results;
      _ref = this.mget('overlays');
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        overlayspec = _ref[_i];
        _results.push(this.overlays[overlayspec.id].bind_events(this));
      }
      return _results;
    };

    PlotView.prototype.bind_tools = function() {
      var toolspec, _i, _len, _ref, _results;
      _ref = this.mget('tools');
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        toolspec = _ref[_i];
        _results.push(this.tools[toolspec.id].bind_events(this));
      }
      return _results;
    };

    PlotView.prototype.render_mainsvg = function() {
      var node, trans_string;
      node = this.tag_d3('mainsvg');
      if (node === null) {
        node = d3.select(this.el).append('svg').attr('id', this.tag_id('mainsvg'));
        node.append('g').attr('id', this.tag_id('plot'));
        this.tag_d3('plot').append('g').attr('id', this.tag_id('bg'));
        this.tag_d3('plot').append('g').attr('id', this.tag_id('fg'));
        this.tag_d3('bg').append('rect').attr('id', this.tag_id('innerbox'));
        this.tag_d3('fg').append('svg').attr('id', this.tag_id('plotwindow'));
        this.bind_tools();
        this.bind_overlays();
      }
      if (!this.mget('usedialog')) {
        node.attr('x', this.model.position_x()).attr('y', this.model.position_y());
      }
      this.tag_d3('innerbox').attr('fill', this.mget('background_color')).attr('stroke', this.model.get('foreground_color')).attr('width', this.mget('width')).attr("height", this.mget('height'));
      this.tag_d3('plotwindow').attr('width', this.mget('width')).attr('height', this.mget('height'));
      node.attr("width", this.options.scale * this.mget('outerwidth')).attr('height', this.options.scale * this.mget('outerheight'));
      trans_string = "scale(" + this.options.scale + ", " + this.options.scale + ")";
      trans_string += "translate(" + (this.mget('border_space')) + ", " + (this.mget('border_space')) + ")";
      return this.tag_d3('plot').attr('transform', trans_string);
    };

    PlotView.prototype.render = function() {
      PlotView.__super__.render.call(this);
      this.render_mainsvg();
      if (this.mget('usedialog') && !this.$el.is(":visible")) {
        return this.add_dialog();
      }
    };

    PlotView.prototype.render_deferred_components = function(force) {
      var key, view, _ref, _ref2, _ref3, _ref4, _results;
      PlotView.__super__.render_deferred_components.call(this, force);
      _ref = this.axes;
      for (key in _ref) {
        if (!__hasProp.call(_ref, key)) continue;
        view = _ref[key];
        view.render_deferred_components(force);
      }
      _ref2 = this.renderers;
      for (key in _ref2) {
        if (!__hasProp.call(_ref2, key)) continue;
        view = _ref2[key];
        view.render_deferred_components(force);
      }
      _ref3 = this.tools;
      for (key in _ref3) {
        if (!__hasProp.call(_ref3, key)) continue;
        view = _ref3[key];
        view.render_deferred_components(force);
      }
      _ref4 = this.overlays;
      _results = [];
      for (key in _ref4) {
        if (!__hasProp.call(_ref4, key)) continue;
        view = _ref4[key];
        _results.push(view.render_deferred_components(force));
      }
      return _results;
    };

    return PlotView;

  })(Continuum.DeferredParent);

  build_views = Continuum.build_views;

  Plot = (function(_super) {

    __extends(Plot, _super);

    function Plot() {
      Plot.__super__.constructor.apply(this, arguments);
    }

    Plot.prototype.initialize = function(attrs, options) {
      Plot.__super__.initialize.call(this, attrs, options);
      if (!('xrange' in attrs)) {
        this.set('xrange', this.collections['Range1d'].create({
          'start': 0,
          'end': 200
        }, options).ref());
      }
      if (!('yrange' in attrs)) {
        return this.set('yrange', this.collections['Range1d'].create({
          'start': 0,
          'end': 200
        }, options).ref());
      }
    };

    Plot.prototype.dinitialize = function(attrs, options) {
      var _this = this;
      Plot.__super__.dinitialize.call(this, attrs, options);
      this.register_property('width', [
        'xrange', {
          'ref': this.get('xrange'),
          'fields': ['start', 'end']
        }
      ], function() {
        var range;
        range = this.get_ref('xrange');
        return range.get('end') - range.get('start');
      }, true, function(width) {
        var range;
        range = _this.get_ref('xrange');
        range.set('end', range.get('start') + width);
        return null;
      });
      return this.register_property('height', [
        'yrange', {
          'ref': this.get('yrange'),
          'fields': ['start', 'end']
        }
      ], function() {
        var range;
        range = this.get_ref('yrange');
        return range.get('end') - range.get('start');
      }, true, function(height) {
        var range;
        range = _this.get_ref('yrange');
        range.set('end', range.get('start') + height);
        return null;
      });
    };

    Plot.prototype.type = 'Plot';

    Plot.prototype.default_view = PlotView;

    Plot.prototype.parent_properties = ['background_color', 'foreground_color', 'width', 'height', 'border_space'];

    return Plot;

  })(Component);

  Plot.prototype.defaults = _.clone(Plot.prototype.defaults);

  _.extend(Plot.prototype.defaults, {
    'data_sources': {},
    'renderers': [],
    'axes': [],
    'legends': [],
    'tools': [],
    'overlays': [],
    'usedialog': false
  });

  Plot.prototype.display_defaults = _.clone(Plot.prototype.display_defaults);

  _.extend(Plot.prototype.display_defaults, {
    background_color: "#eee",
    foreground_color: "#333"
  });

  Plots = (function(_super) {

    __extends(Plots, _super);

    function Plots() {
      Plots.__super__.constructor.apply(this, arguments);
    }

    Plots.prototype.model = Plot;

    return Plots;

  })(Continuum.Collection);

  D3LinearAxisView = (function(_super) {

    __extends(D3LinearAxisView, _super);

    function D3LinearAxisView() {
      D3LinearAxisView.__super__.constructor.apply(this, arguments);
    }

    D3LinearAxisView.prototype.initialize = function(options) {
      D3LinearAxisView.__super__.initialize.call(this, options);
      safebind(this, this.plot_model, 'change', this.request_render);
      safebind(this, this.model, 'change', this.request_render);
      return safebind(this, this.mget_ref('mapper'), 'change', this.request_render);
    };

    D3LinearAxisView.prototype.get_offsets = function(orientation) {
      var offsets;
      offsets = {
        x: 0,
        y: 0
      };
      if (orientation === 'bottom') offsets['y'] += this.plot_model.get('height');
      return offsets;
    };

    D3LinearAxisView.prototype.get_tick_size = function(orientation) {
      if (!_.isNull(this.mget('tickSize'))) {
        return this.mget('tickSize');
      } else {
        if (orientation === 'bottom') {
          return -this.plot_model.get('height');
        } else {
          return -this.plot_model.get('width');
        }
      }
    };

    D3LinearAxisView.prototype.convert_scale = function(scale) {
      var domain, func, range, _ref;
      domain = scale.domain();
      range = scale.range();
      if ((_ref = this.mget('orientation')) === 'bottom' || _ref === 'top') {
        func = 'xpos';
      } else {
        func = 'ypos';
      }
      range = [this.plot_model[func](range[0]), this.plot_model[func](range[1])];
      scale = d3.scale.linear().domain(domain).range(range);
      return scale;
    };

    D3LinearAxisView.prototype.render = function() {
      var axis, base, node, offsets, scale_converted, temp, ticksize;
      D3LinearAxisView.__super__.render.call(this);
      base = this.tag_d3('bg', this.plot_id);
      node = this.tag_d3('axis');
      if (!node) {
        node = base.append('g').attr('id', this.tag_id('axis')).attr('class', 'D3LinearAxisView').attr('stroke', this.mget('foreground_color'));
      }
      offsets = this.get_offsets(this.mget('orientation'));
      offsets['h'] = this.plot_model.get('height');
      node.attr('transform', _.template('translate({{x}}, {{y}})', offsets));
      axis = d3.svg.axis();
      ticksize = this.get_tick_size(this.mget('orientation'));
      scale_converted = this.convert_scale(this.mget_ref('mapper').get('scale'));
      temp = axis.scale(scale_converted);
      temp.orient(this.mget('orientation')).ticks(this.mget('ticks')).tickSubdivide(this.mget('tickSubdivide')).tickSize(ticksize).tickPadding(this.mget('tickPadding'));
      node.call(axis);
      return node.selectAll('.tick').attr('stroke', this.mget('tick_color'));
    };

    return D3LinearAxisView;

  })(PlotWidget);

  D3LinearAxis = (function(_super) {

    __extends(D3LinearAxis, _super);

    function D3LinearAxis() {
      D3LinearAxis.__super__.constructor.apply(this, arguments);
    }

    D3LinearAxis.prototype.type = 'D3LinearAxis';

    D3LinearAxis.prototype.default_view = D3LinearAxisView;

    D3LinearAxis.prototype.display_defaults = {
      tick_color: '#fff'
    };

    return D3LinearAxis;

  })(Component);

  D3LinearAxis.prototype.defaults = _.clone(D3LinearAxis.prototype.defaults);

  _.extend(D3LinearAxis.prototype.defaults, {
    mapper: null,
    orientation: 'bottom',
    ticks: 10,
    ticksSubdivide: 1,
    tickSize: null,
    tickPadding: 3
  });

  D3LinearAxes = (function(_super) {

    __extends(D3LinearAxes, _super);

    function D3LinearAxes() {
      D3LinearAxes.__super__.constructor.apply(this, arguments);
    }

    D3LinearAxes.prototype.model = D3LinearAxis;

    return D3LinearAxes;

  })(Continuum.Collection);

  BarRendererView = (function(_super) {

    __extends(BarRendererView, _super);

    function BarRendererView() {
      BarRendererView.__super__.constructor.apply(this, arguments);
    }

    BarRendererView.prototype.initialize = function(options) {
      safebind(this, this.model, 'change', this.request_render);
      safebind(this, this.mget_ref('xmapper'), 'change', this.request_render);
      safebind(this, this.mget_ref('ymapper'), 'change', this.request_render);
      safebind(this, this.mget_ref('data_source'), 'change:data', this.request_render);
      return BarRendererView.__super__.initialize.call(this, options);
    };

    BarRendererView.prototype.render_bars = function(node, orientation) {
      var data_source, index_coord, index_dimension, index_field, index_mapper, indexpos, thickness, value_coord, value_dimension, value_field, value_mapper, valuepos,
        _this = this;
      if (orientation === 'vertical') {
        index_mapper = this.mget_ref('xmapper');
        value_mapper = this.mget_ref('ymapper');
        value_field = this.mget('yfield');
        index_field = this.mget('xfield');
        index_coord = 'x';
        value_coord = 'y';
        index_dimension = 'width';
        value_dimension = 'height';
        indexpos = function(x, width) {
          return _this.model.position_object_x(x, _this.mget('width'), width);
        };
        valuepos = function(y, height) {
          return _this.model.position_object_y(y, _this.mget('height'), height);
        };
      } else {
        index_mapper = this.mget_ref('ymapper');
        value_mapper = this.mget_ref('xmapper');
        value_field = this.mget('xfield');
        index_field = this.mget('yfield');
        index_coord = 'y';
        value_coord = 'x';
        index_dimension = 'height';
        value_dimension = 'width';
        valuepos = function(x, width) {
          return _this.model.position_object_x(x, _this.mget('width'), width);
        };
        indexpos = function(y, height) {
          return _this.model.position_object_y(y, _this.mget('height'), height);
        };
      }
      if (!_.isObject(index_field)) {
        index_field = {
          'field': index_field
        };
      }
      data_source = this.mget_ref('data_source');
      if (_.has(index_field, 'field')) {
        if (_.has(index_field, index_dimension)) {
          thickness = index_field[index_dimension];
        } else {
          thickness = 0.85 * this.plot_model.get(index_dimension);
          thickness = thickness / data_source.get('data').length;
        }
        node.attr(index_coord, function(d) {
          var ctr;
          ctr = index_mapper.map_screen(d[index_field['field']]);
          return indexpos(ctr - thickness / 2.0, thickness);
        }).attr(index_dimension, thickness);
      } else {
        node.attr(index_coord, function(d) {
          var end, start, _ref, _ref2;
          _ref = [index_mapper.map_screen(d[index_field['start']]), index_mapper.map_screen(d[index_field['end']])], start = _ref[0], end = _ref[1];
          _ref2 = [indexpos(start, 0), indexpos(end, 0)], start = _ref2[0], end = _ref2[1];
          return d3.min([xstart, end]);
        }).attr(index_dimension, function(d) {
          var end, start, _ref, _ref2;
          _ref = [index_mapper.map_screen(d[index_field['start']]), index_mapper.map_screen(d[index_field['end']])], start = _ref[0], end = _ref[1];
          _ref2 = [indexpos(start, 0), indexpos(end, 0)], start = _ref2[0], end = _ref2[1];
          return d3.abs(end(-start));
        });
      }
      node.attr(value_coord, function(d) {
        var length, location;
        length = value_mapper.get('scale_factor') * d[value_field];
        location = value_mapper.map_screen(0);
        return valuepos(location, length);
      }).attr(value_dimension, function(d) {
        return value_mapper.get('scale_factor') * d[value_field];
      });
      node.attr('stroke', this.mget('foreground_color')).attr('fill', this.mget('foreground_color'));
      return null;
    };

    BarRendererView.prototype.render = function() {
      var bars, node, plot;
      BarRendererView.__super__.render.call(this);
      plot = this.tag_d3('plotwindow', this.plot_id);
      node = this.tag_d3('bar');
      if (!node) node = plot.append('g').attr('id', this.tag_id('bar'));
      bars = node.selectAll('rect').data(this.model.get_ref('data_source').get('data'));
      this.render_bars(bars, this.mget('orientation'));
      this.render_bars(bars.enter().append('rect'), this.mget('orientation'));
      return null;
    };

    return BarRendererView;

  })(PlotWidget);

  BarRenderer = (function(_super) {

    __extends(BarRenderer, _super);

    function BarRenderer() {
      BarRenderer.__super__.constructor.apply(this, arguments);
    }

    BarRenderer.prototype.type = 'BarRenderer';

    BarRenderer.prototype.default_view = BarRendererView;

    return BarRenderer;

  })(XYRenderer);

  BarRenderer.prototype.defaults = _.clone(BarRenderer.prototype.defaults);

  _.extend(BarRenderer.prototype.defaults, {
    xmapper: null,
    ymapper: null,
    orientation: 'vertical',
    xfield: 'x',
    yfield: 'y',
    color: "#000"
  });

  BarRenderers = (function(_super) {

    __extends(BarRenderers, _super);

    function BarRenderers() {
      BarRenderers.__super__.constructor.apply(this, arguments);
    }

    BarRenderers.prototype.model = BarRenderer;

    return BarRenderers;

  })(Continuum.Collection);

  LineRendererView = (function(_super) {

    __extends(LineRendererView, _super);

    function LineRendererView() {
      LineRendererView.__super__.constructor.apply(this, arguments);
    }

    LineRendererView.prototype.initialize = function(options) {
      safebind(this, this.model, 'change', this.request_render);
      safebind(this, this.mget_ref('xmapper'), 'change', this.request_render);
      safebind(this, this.mget_ref('ymapper'), 'change', this.request_render);
      safebind(this, this.mget_ref('data_source'), 'change:data', this.request_render);
      return LineRendererView.__super__.initialize.call(this, options);
    };

    LineRendererView.prototype.render_line = function(node) {
      var line, xfield, xmapper, yfield, ymapper,
        _this = this;
      xmapper = this.model.get_ref('xmapper');
      ymapper = this.model.get_ref('ymapper');
      xfield = this.model.get('xfield');
      yfield = this.model.get('yfield');
      line = d3.svg.line().x(function(d) {
        var pos;
        pos = xmapper.map_screen(d[xfield]);
        return _this.model.xpos(pos);
      }).y(function(d) {
        var pos;
        pos = ymapper.map_screen(d[yfield]);
        return _this.model.ypos(pos);
      });
      node.attr('stroke', this.mget('color')).attr('d', line);
      node.attr('fill', 'none');
      return null;
    };

    LineRendererView.prototype.render = function() {
      var node, path, plot;
      LineRendererView.__super__.render.call(this);
      plot = this.tag_d3('plotwindow', this.plot_id);
      node = this.tag_d3('line');
      if (!node) node = plot.append('g').attr('id', this.tag_id('line'));
      path = node.selectAll('path').data([this.model.get_ref('data_source').get('data')]);
      this.render_line(path);
      this.render_line(path.enter().append('path'));
      return null;
    };

    return LineRendererView;

  })(PlotWidget);

  LineRenderer = (function(_super) {

    __extends(LineRenderer, _super);

    function LineRenderer() {
      LineRenderer.__super__.constructor.apply(this, arguments);
    }

    LineRenderer.prototype.type = 'LineRenderer';

    LineRenderer.prototype.default_view = LineRendererView;

    return LineRenderer;

  })(XYRenderer);

  LineRenderer.prototype.defaults = _.clone(LineRenderer.prototype.defaults);

  _.extend(LineRenderer.prototype.defaults, {
    xmapper: null,
    ymapper: null,
    xfield: null,
    yfield: null,
    color: "#000"
  });

  LineRenderers = (function(_super) {

    __extends(LineRenderers, _super);

    function LineRenderers() {
      LineRenderers.__super__.constructor.apply(this, arguments);
    }

    LineRenderers.prototype.model = LineRenderer;

    return LineRenderers;

  })(Continuum.Collection);

  window.scatter_render = 0;

  ScatterRendererView = (function(_super) {

    __extends(ScatterRendererView, _super);

    function ScatterRendererView() {
      ScatterRendererView.__super__.constructor.apply(this, arguments);
    }

    ScatterRendererView.prototype.request_render = function() {
      return ScatterRendererView.__super__.request_render.call(this);
    };

    ScatterRendererView.prototype.initialize = function(options) {
      ScatterRendererView.__super__.initialize.call(this, options);
      safebind(this, this.model, 'change', this.request_render);
      safebind(this, this.mget_ref('xmapper'), 'change', this.request_render);
      safebind(this, this.mget_ref('ymapper'), 'change', this.request_render);
      return safebind(this, this.mget_ref('data_source'), 'change', this.request_render);
    };

    ScatterRendererView.prototype.fill_marks = function(marks) {
      var color, color_field, color_mapper,
        _this = this;
      window.scatter_render += 1;
      color_field = this.model.get('color_field');
      if (color_field) {
        color_mapper = this.model.get_ref('color_mapper');
        marks.attr('fill', function(d) {
          return color_mapper.map_screen(d[color_field]);
        });
      } else {
        color = this.model.get('foreground_color');
        marks.attr('fill', color);
      }
      return null;
    };

    ScatterRendererView.prototype.size_marks = function(marks) {
      marks.attr('r', this.model.get('radius'));
      return null;
    };

    ScatterRendererView.prototype.position_marks = function(marks) {
      var xfield, xmapper, yfield, ymapper,
        _this = this;
      xmapper = this.model.get_ref('xmapper');
      ymapper = this.model.get_ref('ymapper');
      xfield = this.model.get('xfield');
      yfield = this.model.get('yfield');
      marks.attr('cx', function(d) {
        var pos;
        pos = xmapper.map_screen(d[xfield]);
        return _this.model.xpos(pos);
      }).attr('cy', function(d) {
        var pos;
        pos = ymapper.map_screen(d[yfield]);
        return _this.model.ypos(pos);
      });
      return null;
    };

    ScatterRendererView.prototype.get_marks = function() {
      var circles, node, plot;
      plot = this.tag_d3('plotwindow', this.plot_id);
      node = this.tag_d3('scatter');
      if (!node) node = plot.append('g').attr('id', this.tag_id('scatter'));
      return circles = node.selectAll(this.model.get('mark')).data(this.model.get_ref('data_source').get('data'));
    };

    ScatterRendererView.prototype.get_new_marks = function(marks) {
      return marks.enter().append(this.model.get('mark'));
    };

    ScatterRendererView.prototype.render = function() {
      var circles, newcircles;
      ScatterRendererView.__super__.render.call(this);
      circles = this.get_marks();
      this.position_marks(circles);
      this.size_marks(circles);
      this.fill_marks(circles);
      newcircles = this.get_new_marks(circles);
      this.position_marks(newcircles);
      this.size_marks(newcircles);
      this.fill_marks(newcircles);
      circles.exit().remove();
      return null;
    };

    return ScatterRendererView;

  })(PlotWidget);

  ScatterRenderer = (function(_super) {

    __extends(ScatterRenderer, _super);

    function ScatterRenderer() {
      ScatterRenderer.__super__.constructor.apply(this, arguments);
    }

    ScatterRenderer.prototype.type = 'ScatterRenderer';

    ScatterRenderer.prototype.default_view = ScatterRendererView;

    return ScatterRenderer;

  })(XYRenderer);

  ScatterRenderer.prototype.defaults = _.clone(ScatterRenderer.prototype.defaults);

  _.extend(ScatterRenderer.prototype.defaults, {
    data_source: null,
    xmapper: null,
    ymapper: null,
    xfield: null,
    yfield: null,
    colormapper: null,
    colorfield: null,
    mark: 'circle'
  });

  ScatterRenderer.prototype.display_defaults = _.clone(ScatterRenderer.prototype.display_defaults);

  _.extend(ScatterRenderer.prototype.display_defaults, {
    radius: 3
  });

  ScatterRenderers = (function(_super) {

    __extends(ScatterRenderers, _super);

    function ScatterRenderers() {
      ScatterRenderers.__super__.constructor.apply(this, arguments);
    }

    ScatterRenderers.prototype.model = ScatterRenderer;

    return ScatterRenderers;

  })(Continuum.Collection);

  PanToolView = (function(_super) {

    __extends(PanToolView, _super);

    function PanToolView() {
      PanToolView.__super__.constructor.apply(this, arguments);
    }

    PanToolView.prototype.initialize = function(options) {
      this.dragging = false;
      return PanToolView.__super__.initialize.call(this, options);
    };

    PanToolView.prototype.mouse_coords = function() {
      var plot, x, y, _ref, _ref2;
      plot = this.tag_d3('plotwindow', this.plot_id);
      _ref = d3.mouse(plot[0][0]), x = _ref[0], y = _ref[1];
      _ref2 = [this.plot_model.rxpos(x), this.plot_model.rypos(y)], x = _ref2[0], y = _ref2[1];
      return [x, y];
    };

    PanToolView.prototype._start_drag_mapper = function(mapper) {
      var range;
      range = mapper.get_ref('data_range');
      range[this.tag_id('start')] = range.get('start');
      return range[this.tag_id('end')] = range.get('end');
    };

    PanToolView.prototype._start_drag = function() {
      var x, xmap, xmappers, ymap, ymappers, _i, _j, _len, _len2, _ref, _results;
      this.dragging = true;
      _ref = this.mouse_coords(), this.x = _ref[0], this.y = _ref[1];
      xmappers = (function() {
        var _i, _len, _ref2, _results;
        _ref2 = this.mget('xmappers');
        _results = [];
        for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
          x = _ref2[_i];
          _results.push(this.model.resolve_ref(x));
        }
        return _results;
      }).call(this);
      ymappers = (function() {
        var _i, _len, _ref2, _results;
        _ref2 = this.mget('ymappers');
        _results = [];
        for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
          x = _ref2[_i];
          _results.push(this.model.resolve_ref(x));
        }
        return _results;
      }).call(this);
      for (_i = 0, _len = xmappers.length; _i < _len; _i++) {
        xmap = xmappers[_i];
        this._start_drag_mapper(xmap);
      }
      _results = [];
      for (_j = 0, _len2 = ymappers.length; _j < _len2; _j++) {
        ymap = ymappers[_j];
        _results.push(this._start_drag_mapper(ymap));
      }
      return _results;
    };

    PanToolView.prototype._drag_mapper = function(mapper, diff) {
      var data_range, end, screen_range, screenhigh, screenlow, start, _ref;
      screen_range = mapper.get_ref('screen_range');
      data_range = mapper.get_ref('data_range');
      screenlow = screen_range.get('start') - diff;
      screenhigh = screen_range.get('end') - diff;
      _ref = [mapper.map_data(screenlow), mapper.map_data(screenhigh)], start = _ref[0], end = _ref[1];
      return data_range.set({
        'start': start,
        'end': end
      }, {
        'local': true
      });
    };

    PanToolView.prototype._drag = function(xdiff, ydiff) {
      var plot, x, xmap, xmappers, y, ymap, ymappers, _i, _j, _len, _len2, _ref, _ref2, _results;
      plot = this.tag_d3('plotwindow', this.plot_id);
      if (_.isUndefined(xdiff) || _.isUndefined(ydiff)) {
        _ref = this.mouse_coords(), x = _ref[0], y = _ref[1];
        xdiff = x - this.x;
        ydiff = y - this.y;
        _ref2 = [x, y], this.x = _ref2[0], this.y = _ref2[1];
      }
      xmappers = (function() {
        var _i, _len, _ref3, _results;
        _ref3 = this.mget('xmappers');
        _results = [];
        for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
          x = _ref3[_i];
          _results.push(this.model.resolve_ref(x));
        }
        return _results;
      }).call(this);
      ymappers = (function() {
        var _i, _len, _ref3, _results;
        _ref3 = this.mget('ymappers');
        _results = [];
        for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
          x = _ref3[_i];
          _results.push(this.model.resolve_ref(x));
        }
        return _results;
      }).call(this);
      for (_i = 0, _len = xmappers.length; _i < _len; _i++) {
        xmap = xmappers[_i];
        this._drag_mapper(xmap, xdiff);
      }
      _results = [];
      for (_j = 0, _len2 = ymappers.length; _j < _len2; _j++) {
        ymap = ymappers[_j];
        _results.push(this._drag_mapper(ymap, ydiff));
      }
      return _results;
    };

    PanToolView.prototype.bind_events = function(plotview) {
      var node,
        _this = this;
      this.plotview = plotview;
      node = this.tag_d3('mainsvg', this.plot_id);
      node.attr('pointer-events', 'all');
      return node.on("mousemove.drag", function() {
        if (d3.event.shiftKey) {
          if (!_this.dragging) {
            _this._start_drag();
          } else {
            _this._drag();
          }
          d3.event.preventDefault();
          d3.event.stopPropagation();
        } else {
          _this.dragging = false;
        }
        return null;
      });
    };

    return PanToolView;

  })(PlotWidget);

  PanTool = (function(_super) {

    __extends(PanTool, _super);

    function PanTool() {
      PanTool.__super__.constructor.apply(this, arguments);
    }

    PanTool.prototype.type = "PanTool";

    PanTool.prototype.default_view = PanToolView;

    return PanTool;

  })(Continuum.HasParent);

  PanTool.prototype.defaults = _.clone(PanTool.prototype.defaults);

  _.extend(PanTool.prototype.defaults, {
    xmappers: [],
    ymappers: []
  });

  PanTools = (function(_super) {

    __extends(PanTools, _super);

    function PanTools() {
      PanTools.__super__.constructor.apply(this, arguments);
    }

    PanTools.prototype.model = PanTool;

    return PanTools;

  })(Continuum.Collection);

  ZoomToolView = (function(_super) {

    __extends(ZoomToolView, _super);

    function ZoomToolView() {
      ZoomToolView.__super__.constructor.apply(this, arguments);
    }

    ZoomToolView.prototype.initialize = function(options) {
      return ZoomToolView.__super__.initialize.call(this, options);
    };

    ZoomToolView.prototype.mouse_coords = function() {
      var plot, x, y, _ref, _ref2;
      plot = this.tag_d3('plotwindow', this.plot_id);
      _ref = d3.mouse(plot[0][0]), x = _ref[0], y = _ref[1];
      _ref2 = [this.plot_model.rxpos(x), this.plot_model.rypos(y)], x = _ref2[0], y = _ref2[1];
      return [x, y];
    };

    ZoomToolView.prototype._zoom_mapper = function(mapper, eventpos, factor) {
      var data_range, end, screen_range, screenhigh, screenlow, start, _ref;
      screen_range = mapper.get_ref('screen_range');
      data_range = mapper.get_ref('data_range');
      screenlow = screen_range.get('start');
      screenhigh = screen_range.get('end');
      start = screenlow - (eventpos - screenlow) * factor;
      end = screenhigh + (screenhigh - eventpos) * factor;
      _ref = [mapper.map_data(start), mapper.map_data(end)], start = _ref[0], end = _ref[1];
      return data_range.set({
        'start': start,
        'end': end
      }, {
        'local': true
      });
    };

    ZoomToolView.prototype._zoom = function() {
      var factor, mapper, x, xmap, xmappers, y, ymap, ymappers, _i, _j, _len, _len2, _ref, _results;
      _ref = this.mouse_coords(), x = _ref[0], y = _ref[1];
      factor = -this.mget('speed') * d3.event.wheelDelta;
      xmappers = (function() {
        var _i, _len, _ref2, _results;
        _ref2 = this.mget('xmappers');
        _results = [];
        for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
          mapper = _ref2[_i];
          _results.push(this.model.resolve_ref(mapper));
        }
        return _results;
      }).call(this);
      ymappers = (function() {
        var _i, _len, _ref2, _results;
        _ref2 = this.mget('ymappers');
        _results = [];
        for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
          mapper = _ref2[_i];
          _results.push(this.model.resolve_ref(mapper));
        }
        return _results;
      }).call(this);
      for (_i = 0, _len = xmappers.length; _i < _len; _i++) {
        xmap = xmappers[_i];
        this._zoom_mapper(xmap, x, factor);
      }
      _results = [];
      for (_j = 0, _len2 = ymappers.length; _j < _len2; _j++) {
        ymap = ymappers[_j];
        _results.push(this._zoom_mapper(ymap, y, factor));
      }
      return _results;
    };

    ZoomToolView.prototype.bind_events = function(plotview) {
      var node,
        _this = this;
      this.plotview = plotview;
      node = this.tag_d3('mainsvg', this.plot_id);
      node.attr('pointer-events', 'all');
      return node.on("mousewheel.zoom", function() {
        _this._zoom();
        d3.event.preventDefault();
        return d3.event.stopPropagation();
      });
    };

    return ZoomToolView;

  })(PlotWidget);

  ZoomTool = (function(_super) {

    __extends(ZoomTool, _super);

    function ZoomTool() {
      ZoomTool.__super__.constructor.apply(this, arguments);
    }

    ZoomTool.prototype.type = "ZoomTool";

    ZoomTool.prototype.default_view = ZoomToolView;

    return ZoomTool;

  })(Continuum.HasParent);

  ZoomTool.prototype.defaults = _.clone(ZoomTool.prototype.defaults);

  _.extend(ZoomTool.prototype.defaults, {
    xmappers: [],
    ymappers: [],
    speed: 1 / 600
  });

  ZoomTools = (function(_super) {

    __extends(ZoomTools, _super);

    function ZoomTools() {
      ZoomTools.__super__.constructor.apply(this, arguments);
    }

    ZoomTools.prototype.model = ZoomTool;

    return ZoomTools;

  })(Continuum.Collection);

  SelectionToolView = (function(_super) {

    __extends(SelectionToolView, _super);

    function SelectionToolView() {
      SelectionToolView.__super__.constructor.apply(this, arguments);
    }

    SelectionToolView.prototype.initialize = function(options) {
      var renderer, select_callback, _i, _len, _ref, _results,
        _this = this;
      SelectionToolView.__super__.initialize.call(this, options);
      this.selecting = false;
      select_callback = _.debounce((function() {
        return _this._select_data();
      }), 50);
      safebind(this, this.model, 'change', this.request_render);
      safebind(this, this.model, 'change', select_callback);
      _ref = this.mget('renderers');
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        renderer = _ref[_i];
        renderer = this.model.resolve_ref(renderer);
        safebind(this, renderer, 'change', this.request_render);
        safebind(this, renderer.get_ref('xmapper'), 'change', this.request_render);
        safebind(this, renderer.get_ref('ymapper'), 'change', this.request_render);
        safebind(this, renderer.get_ref('data_source'), 'change', this.request_render);
        safebind(this, renderer, 'change', select_callback);
        safebind(this, renderer.get_ref('xmapper'), 'change', select_callback);
        _results.push(safebind(this, renderer.get_ref('ymapper'), 'change', select_callback));
      }
      return _results;
    };

    SelectionToolView.prototype.bind_events = function(plotview) {
      var node,
        _this = this;
      this.plotview = plotview;
      node = this.tag_d3('mainsvg', this.plot_id);
      node.attr('pointer-events', 'all');
      node.on("mousedown.selection", function() {
        return _this._stop_selecting();
      });
      return node.on("mousemove.selection", function() {
        if (d3.event.ctrlKey) {
          if (!_this.selecting) {
            _this._start_selecting();
          } else {
            _this._selecting();
          }
          d3.event.preventDefault();
          d3.event.stopPropagation();
        }
        return null;
      });
    };

    SelectionToolView.prototype.mouse_coords = function() {
      var plot, x, y, _ref, _ref2;
      plot = this.tag_d3('plotwindow', this.plot_id);
      _ref = d3.mouse(plot[0][0]), x = _ref[0], y = _ref[1];
      _ref2 = [this.plot_model.rxpos(x), this.plot_model.rypos(y)], x = _ref2[0], y = _ref2[1];
      return [x, y];
    };

    SelectionToolView.prototype._stop_selecting = function() {
      var node, renderer, _i, _len, _ref;
      this.mset({
        start_x: null,
        start_y: null,
        current_x: null,
        current_y: null
      });
      _ref = this.mget('renderers');
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        renderer = _ref[_i];
        this.model.resolve_ref(renderer).get_ref('data_source').set('selecting', false);
        this.model.resolve_ref(renderer).get_ref('data_source').save();
      }
      this.selecting = false;
      node = this.tag_d3('rect');
      if (!(node === null)) return node.remove();
    };

    SelectionToolView.prototype._start_selecting = function() {
      var data_source, renderer, x, y, _i, _len, _ref, _ref2;
      _ref = this.mouse_coords(), x = _ref[0], y = _ref[1];
      this.mset({
        'start_x': x,
        'start_y': y,
        'current_x': null,
        'current_y': null
      });
      _ref2 = this.mget('renderers');
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        renderer = _ref2[_i];
        data_source = this.model.resolve_ref(renderer).get_ref('data_source');
        data_source.set('selecting', true);
        data_source.save();
      }
      return this.selecting = true;
    };

    SelectionToolView.prototype._get_selection_range = function() {
      var xrange, yrange;
      xrange = [this.mget('start_x'), this.mget('current_x')];
      yrange = [this.mget('start_y'), this.mget('current_y')];
      if (this.mget('select_x')) {
        xrange = [d3.min(xrange), d3.max(xrange)];
      } else {
        xrange = null;
      }
      if (this.mget('select_y')) {
        yrange = [d3.min(yrange), d3.max(yrange)];
      } else {
        yrange = null;
      }
      return [xrange, yrange];
    };

    SelectionToolView.prototype._selecting = function() {
      var x, y, _ref;
      _ref = this.mouse_coords(), x = _ref[0], y = _ref[1];
      this.mset({
        'current_x': x,
        'current_y': y
      });
      return null;
    };

    SelectionToolView.prototype._select_data = function() {
      var datasource, datasource_id, datasource_selections, datasources, k, renderer, selected, v, xrange, yrange, _i, _j, _len, _len2, _ref, _ref2, _ref3;
      if (!this.selecting) return;
      _ref = this._get_selection_range(), xrange = _ref[0], yrange = _ref[1];
      datasources = {};
      datasource_selections = {};
      _ref2 = this.mget('renderers');
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        renderer = _ref2[_i];
        datasource = this.model.resolve_ref(renderer).get_ref('data_source');
        datasources[datasource.id] = datasource;
      }
      _ref3 = this.mget('renderers');
      for (_j = 0, _len2 = _ref3.length; _j < _len2; _j++) {
        renderer = _ref3[_j];
        datasource_id = this.model.resolve_ref(renderer).get_ref('data_source').id;
        _.setdefault(datasource_selections, datasource_id, []);
        selected = this.model.resolve_ref(renderer).select(xrange, yrange);
        datasource_selections[datasource.id].push(selected);
      }
      for (k in datasource_selections) {
        if (!__hasProp.call(datasource_selections, k)) continue;
        v = datasource_selections[k];
        selected = _.intersect.apply(_, v);
        datasources[k].set('selected', selected);
        datasources[k].save();
      }
      return null;
    };

    SelectionToolView.prototype._render_shading = function() {
      var height, node, width, xrange, yrange, _ref;
      _ref = this._get_selection_range(), xrange = _ref[0], yrange = _ref[1];
      if (_.any(_.map(xrange, _.isNullOrUndefined)) || _.any(_.map(yrange, _.isNullOrUndefined))) {
        return;
      }
      node = this.tag_d3('rect');
      if (node === null) {
        node = this.tag_d3('plotwindow', this.plot_id).append('rect').attr('id', this.tag_id('rect'));
      }
      if (xrange) {
        width = xrange[1] - xrange[0];
        node.attr('x', this.plot_model.position_child_x(width, xrange[0])).attr('width', width);
      } else {
        width = this.plot_model.get('width');
        node.attr('x', this.plot_model.position_child_x(xrange[0])).attr('width', width);
      }
      if (yrange) {
        height = yrange[1] - yrange[0];
        node.attr('y', this.plot_model.position_child_y(height, yrange[0])).attr('height', height);
      } else {
        height = this.plot_model.get('height');
        node.attr('y', this.plot_model.position_child_y(height, yrange[0])).attr('height', height);
      }
      return node.attr('fill', '#000').attr('fill-opacity', 0.1);
    };

    SelectionToolView.prototype.render = function() {
      SelectionToolView.__super__.render.call(this);
      this._render_shading();
      return null;
    };

    return SelectionToolView;

  })(PlotWidget);

  SelectionTool = (function(_super) {

    __extends(SelectionTool, _super);

    function SelectionTool() {
      SelectionTool.__super__.constructor.apply(this, arguments);
    }

    SelectionTool.prototype.type = "SelectionTool";

    SelectionTool.prototype.default_view = SelectionToolView;

    return SelectionTool;

  })(Continuum.HasParent);

  SelectionTool.prototype.defaults = _.clone(SelectionTool.prototype.defaults);

  _.extend(SelectionTool.prototype.defaults, {
    renderers: [],
    select_x: true,
    select_y: true,
    data_source_options: {}
  });

  SelectionTools = (function(_super) {

    __extends(SelectionTools, _super);

    function SelectionTools() {
      SelectionTools.__super__.constructor.apply(this, arguments);
    }

    SelectionTools.prototype.model = SelectionTool;

    return SelectionTools;

  })(Continuum.Collection);

  OverlayView = (function(_super) {

    __extends(OverlayView, _super);

    function OverlayView() {
      OverlayView.__super__.constructor.apply(this, arguments);
    }

    OverlayView.prototype.initialize = function(options) {
      this.renderer_ids = options['renderer_ids'];
      return OverlayView.__super__.initialize.call(this, options);
    };

    OverlayView.prototype.bind_events = function(plotview) {
      this.plotview = plotview;
      return null;
    };

    return OverlayView;

  })(PlotWidget);

  window.overlay_render = 0;

  ScatterSelectionOverlayView = (function(_super) {

    __extends(ScatterSelectionOverlayView, _super);

    function ScatterSelectionOverlayView() {
      ScatterSelectionOverlayView.__super__.constructor.apply(this, arguments);
    }

    ScatterSelectionOverlayView.prototype.request_render = function() {
      return ScatterSelectionOverlayView.__super__.request_render.call(this);
    };

    ScatterSelectionOverlayView.prototype.initialize = function(options) {
      var renderer, _i, _len, _ref, _results;
      ScatterSelectionOverlayView.__super__.initialize.call(this, options);
      _ref = this.mget('renderers');
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        renderer = _ref[_i];
        renderer = this.model.resolve_ref(renderer);
        safebind(this, renderer, 'change', this.request_render);
        safebind(this, renderer.get_ref('xmapper'), 'change', this.request_render);
        safebind(this, renderer.get_ref('ymapper'), 'change', this.request_render);
        _results.push(safebind(this, renderer.get_ref('data_source'), 'change', this.request_render));
      }
      return _results;
    };

    ScatterSelectionOverlayView.prototype.render = function() {
      var idx, marks, node, renderer, selected, temp, viewid, _i, _j, _len, _len2, _ref, _ref2,
        _this = this;
      window.overlay_render += 1;
      ScatterSelectionOverlayView.__super__.render.call(this);
      _ref = _.zip(this.mget('renderers'), this.renderer_ids);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        temp = _ref[_i];
        renderer = temp[0], viewid = temp[1];
        renderer = this.model.resolve_ref(renderer);
        selected = {};
        if (renderer.get_ref('data_source').get('selecting') === false) continue;
        _ref2 = renderer.get_ref('data_source').get('selected');
        for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
          idx = _ref2[_j];
          selected[String(idx)] = true;
        }
        node = this.tag_d3('scatter', viewid);
        node.selectAll(renderer.get('mark')).filter(function(d, i) {
          return !selected[String(i)];
        }).attr('fill', this.mget('unselected_color'));
        marks = node.selectAll(renderer.get('mark')).filter(function(d, i) {
          return selected[String(i)];
        });
        this.plotview.renderers[renderer.id].fill_marks(marks);
      }
      return null;
    };

    return ScatterSelectionOverlayView;

  })(OverlayView);

  ScatterSelectionOverlay = (function(_super) {

    __extends(ScatterSelectionOverlay, _super);

    function ScatterSelectionOverlay() {
      ScatterSelectionOverlay.__super__.constructor.apply(this, arguments);
    }

    ScatterSelectionOverlay.prototype.type = "ScatterSelectionOverlay";

    ScatterSelectionOverlay.prototype.default_view = ScatterSelectionOverlayView;

    ScatterSelectionOverlay.prototype.defaults = {
      renderers: [],
      unselected_color: "#ccc"
    };

    return ScatterSelectionOverlay;

  })(Continuum.HasParent);

  ScatterSelectionOverlays = (function(_super) {

    __extends(ScatterSelectionOverlays, _super);

    function ScatterSelectionOverlays() {
      ScatterSelectionOverlays.__super__.constructor.apply(this, arguments);
    }

    ScatterSelectionOverlays.prototype.model = ScatterSelectionOverlay;

    return ScatterSelectionOverlays;

  })(Continuum.Collection);

  Bokeh.scatter_plot = function(parent, data_source, xfield, yfield, color_field, mark, colormapper, local) {
    var color_mapper, options, plot_model, scatter_plot, source_name, xaxis, xdr, xmapper, yaxis, ydr, ymapper;
    if (_.isUndefined(local)) local = true;
    options = {
      'local': local
    };
    if (_.isUndefined(mark)) mark = 'circle';
    if (_.isUndefined(color_field)) color_field = null;
    if (_.isUndefined(color_mapper) && color_field) {
      color_mapper = Collections['DiscreteColorMapper'].create({
        data_range: Collections['DataFactorRange'].create({
          data_source: data_source.ref(),
          columns: ['x']
        }, options)
      }, options);
    }
    source_name = data_source.get('name');
    plot_model = Collections['Plot'].create({
      data_sources: {
        source_name: data_source.ref()
      },
      parent: parent
    }, options);
    xdr = Collections['DataRange1d'].create({
      'sources': [
        {
          'ref': data_source.ref(),
          'columns': [xfield]
        }
      ]
    }, options);
    ydr = Collections['DataRange1d'].create({
      'sources': [
        {
          'ref': data_source.ref(),
          'columns': [yfield]
        }
      ]
    }, options);
    xmapper = Collections['LinearMapper'].create({
      data_range: xdr.ref(),
      screen_range: plot_model.get('xrange')
    }, options);
    ymapper = Collections['LinearMapper'].create({
      data_range: ydr.ref(),
      screen_range: plot_model.get('yrange')
    }, options);
    scatter_plot = Collections["ScatterRenderer"].create({
      data_source: data_source.ref(),
      xfield: xfield,
      yfield: yfield,
      color_field: color_field,
      color_mapper: color_mapper,
      mark: mark,
      xmapper: xmapper.ref(),
      ymapper: ymapper.ref(),
      parent: plot_model.ref()
    }, options);
    xaxis = Collections['D3LinearAxis'].create({
      'orientation': 'bottom',
      'mapper': xmapper.ref(),
      'parent': plot_model.ref()
    }, options);
    yaxis = Collections['D3LinearAxis'].create({
      'orientation': 'left',
      'mapper': ymapper.ref(),
      'parent': plot_model.ref()
    }, options);
    return plot_model.set({
      'renderers': [scatter_plot.ref()],
      'axes': [xaxis.ref(), yaxis.ref()]
    }, options);
  };

  make_range_and_mapper = function(data_source, datafields, padding, screen_range, ordinal, options) {
    var mapper, range;
    if (!ordinal) {
      range = Collections['DataRange1d'].create({
        sources: [
          {
            ref: data_source.ref(),
            columns: datafields
          }
        ],
        rangepadding: padding
      }, options);
      mapper = Collections['LinearMapper'].create({
        data_range: range.ref(),
        screen_range: screen_range.ref()
      }, options);
    } else {
      range = Collections['DataFactorRange'].create({
        data_source: data_source.ref(),
        columns: [field]
      }, options);
      mapper = Collections['FactorMapper'].create({
        data_range: range.ref(),
        screen_range: screen_range.ref()
      }, options);
    }
    return [range, mapper];
  };

  Bokeh.make_range_and_mapper = make_range_and_mapper;

  Bokeh.bar_plot = function(parent, data_source, xfield, yfield, orientation, local) {
    var bar_plot, options, plot_model, xaxis, xdr, xmapper, yaxis, ydr, ymapper, _ref, _ref2;
    if (_.isUndefined(local)) local = true;
    options = {
      'local': local
    };
    plot_model = Collections['Plot'].create({
      data_sources: {
        source_name: data_source.ref()
      },
      parent: parent
    }, options);
    _ref = Bokeh.make_range_and_mapper(data_source, [xfield], d3.max([1 / (data_source.get('data').length - 1), 0.1]), plot_model.get_ref('xrange'), false, options), xdr = _ref[0], xmapper = _ref[1];
    _ref2 = Bokeh.make_range_and_mapper(data_source, [yfield], d3.max([1 / (data_source.get('data').length - 1), 0.1]), plot_model.get_ref('yrange'), false, options), ydr = _ref2[0], ymapper = _ref2[1];
    bar_plot = Collections["BarRenderer"].create({
      data_source: data_source.ref(),
      xfield: xfield,
      yfield: yfield,
      xmapper: xmapper.ref(),
      ymapper: ymapper.ref(),
      parent: plot_model.ref(),
      orientation: orientation
    }, options);
    xaxis = Collections['D3LinearAxis'].create({
      orientation: 'bottom',
      mapper: xmapper.ref(),
      parent: plot_model.ref()
    }, options);
    yaxis = Collections['D3LinearAxis'].create({
      orientation: 'left',
      mapper: ymapper.ref(),
      parent: plot_model.ref()
    }, options);
    return plot_model.set({
      renderers: [bar_plot.ref()],
      axes: [xaxis.ref(), yaxis.ref()]
    }, options);
  };

  Bokeh.line_plot = function(parent, data_source, xfield, yfield, local) {
    var line_plot, options, plot_model, source_name, xaxis, xdr, xmapper, yaxis, ydr, ymapper;
    if (_.isUndefined(local)) local = true;
    options = {
      'local': local
    };
    source_name = data_source.get('name');
    plot_model = Collections['Plot'].create({
      data_sources: {
        source_name: data_source.ref()
      },
      parent: parent
    }, options);
    xdr = Collections['DataRange1d'].create({
      'sources': [
        {
          'ref': data_source.ref(),
          'columns': [xfield]
        }
      ]
    }, options);
    ydr = Collections['DataRange1d'].create({
      'sources': [
        {
          'ref': data_source.ref(),
          'columns': [yfield]
        }
      ]
    }, options);
    xmapper = Collections['LinearMapper'].create({
      data_range: xdr.ref(),
      screen_range: plot_model.get('xrange')
    }, options);
    ymapper = Collections['LinearMapper'].create({
      data_range: ydr.ref(),
      screen_range: plot_model.get('yrange')
    }, options);
    line_plot = Collections["LineRenderer"].create({
      data_source: data_source.ref(),
      xfield: xfield,
      yfield: yfield,
      xmapper: xmapper.ref(),
      ymapper: ymapper.ref(),
      parent: plot_model.ref()
    }, options);
    xaxis = Collections['D3LinearAxis'].create({
      'orientation': 'bottom',
      'mapper': xmapper.ref(),
      'parent': plot_model.ref()
    }, options);
    yaxis = Collections['D3LinearAxis'].create({
      'orientation': 'left',
      'mapper': ymapper.ref(),
      'parent': plot_model.ref()
    }, options);
    return plot_model.set({
      'renderers': [line_plot.ref()],
      'axes': [xaxis.ref(), yaxis.ref()]
    }, options);
  };

  Bokeh.register_collection('Plot', new Plots);

  Bokeh.register_collection('ScatterRenderer', new ScatterRenderers);

  Bokeh.register_collection('LineRenderer', new LineRenderers);

  Bokeh.register_collection('BarRenderer', new BarRenderers);

  Bokeh.register_collection('ObjectArrayDataSource', new ObjectArrayDataSources);

  Bokeh.register_collection('Range1d', new Range1ds);

  Bokeh.register_collection('LinearMapper', new LinearMappers);

  Bokeh.register_collection('D3LinearAxis', new D3LinearAxes);

  Bokeh.register_collection('DiscreteColorMapper', new DiscreteColorMappers);

  Bokeh.register_collection('FactorRange', new FactorRanges);

  Bokeh.register_collection('GridPlotContainer', new GridPlotContainers);

  Bokeh.register_collection('DataRange1d', new DataRange1ds);

  Bokeh.register_collection('DataFactorRange', new DataFactorRanges);

  Bokeh.register_collection('PanTool', new PanTools);

  Bokeh.register_collection('ZoomTool', new ZoomTools);

  Bokeh.register_collection('SelectionTool', new SelectionTools);

  Bokeh.register_collection('ScatterSelectionOverlay', new ScatterSelectionOverlays);

  Bokeh.Collections = Collections;

  Bokeh.HasProperties = HasProperties;

  Bokeh.ObjectArrayDataSource = ObjectArrayDataSource;

  Bokeh.Plot = Plot;

  Bokeh.Component = Component;

  Bokeh.ScatterRenderer = ScatterRenderer;

  Bokeh.BokehView = BokehView;

  Bokeh.PlotView = PlotView;

  Bokeh.ScatterRendererView = ScatterRendererView;

  Bokeh.D3LinearAxis = D3LinearAxis;

  Bokeh.LineRendererView = LineRendererView;

  Bokeh.LineRenderers = LineRenderers;

  Bokeh.LineRenderer = LineRenderer;

  Bokeh.BarRendererView = BarRendererView;

  Bokeh.BarRenderers = BarRenderers;

  Bokeh.BarRenderer = BarRenderer;

  Bokeh.GridPlotContainerView = GridPlotContainerView;

  Bokeh.GridPlotContainers = GridPlotContainers;

  Bokeh.GridPlotContainer = GridPlotContainer;

  Bokeh.PanTools = PanTools;

  Bokeh.PanTool = PanTool;

  Bokeh.PanToolView = PanToolView;

  Bokeh.ZoomTools = ZoomTools;

  Bokeh.ZoomTool = ZoomTool;

  Bokeh.ZoomToolView = ZoomToolView;

  Bokeh.SelectionTools = SelectionTools;

  Bokeh.SelectionTool = SelectionTool;

  Bokeh.SelectionToolView = SelectionToolView;

  Bokeh.ScatterSelectionOverlays = ScatterSelectionOverlays;

  Bokeh.ScatterSelectionOverlay = ScatterSelectionOverlay;

  Bokeh.ScatterSelectionOverlayView = ScatterSelectionOverlayView;

}).call(this);
