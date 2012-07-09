var BarRenderer, BarRenderers, Bokeh, BokehView, Collections, Component, D3LinearAxes, D3LinearAxis, DataFactorRange, DataFactorRanges, DataRange1d, DataRange1ds, DiscreteColorMapper, DiscreteColorMappers, FactorRange, FactorRanges, GridPlotContainer, GridPlotContainers, HasProperties, LineRenderer, LineRenderers, LinearMapper, LinearMappers, Mapper, ObjectArrayDataSource, ObjectArrayDataSources, OverlayView, PanTool, PanTools, Plot, Plots, Range1d, Range1ds, ScatterRenderer, ScatterRenderers, ScatterSelectionOverlay, ScatterSelectionOverlayView, ScatterSelectionOverlays, SelectionTool, SelectionTools, XYRenderer, ZoomTool, ZoomToolView, ZoomTools, make_range_and_mapper, safebind,
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
