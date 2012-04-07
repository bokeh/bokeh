(function() {
  var Bokeh, BokehView, Collections, Component, D3LinearAxes, D3LinearAxis, D3LinearAxisView, DiscreteColorMapper, HasParent, HasProperties, HasReference, LinearMapper, LinearMappers, Mapper, ObjectArrayDataSource, ObjectArrayDataSources, Plot, PlotView, Plots, Range1d, Range1ds, Renderer, ScatterRenderer, ScatterRendererView, ScatterRenderers,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  if (this.Bokeh) {
    Bokeh = this.Bokeh;
  } else {
    Bokeh = {};
    this.Bokeh = Bokeh;
  }

  Collections = {};

  Bokeh.register_collection = function(key, value) {
    Collections[key] = value;
    return value.bokeh_key = key;
  };

  "MAIN BOKEH CLASSES";

  BokehView = (function(_super) {

    __extends(BokehView, _super);

    function BokehView() {
      BokehView.__super__.constructor.apply(this, arguments);
    }

    BokehView.prototype.initialize = function(options) {
      if (!_.has(options, 'id')) return this.id = _.uniqueId('BokehView');
    };

    BokehView.prototype.tag_id = function(tag, id) {
      if (!id) id = this.id;
      return tag + "-" + id;
    };

    BokehView.prototype.tag_el = function(tag, id) {
      return this.$el.find("#" + this.tag_id(tag, id));
    };

    BokehView.prototype.tag_d3 = function(tag, id) {
      var val;
      val = d3.select(this.el).select("#" + this.tag_id(tag, id));
      if (val[0][0] === null) {
        return null;
      } else {
        return val;
      }
    };

    BokehView.prototype.mget = function(fld) {
      return this.model.get(fld);
    };

    BokehView.prototype.mget_ref = function(fld) {
      return this.model.get_ref(fld);
    };

    return BokehView;

  })(Backbone.View);

  Renderer = (function(_super) {

    __extends(Renderer, _super);

    function Renderer() {
      Renderer.__super__.constructor.apply(this, arguments);
    }

    Renderer.prototype.initialize = function(options) {
      this.plot_id = options.plot_id;
      this.plot_model = options.plot_model;
      return Renderer.__super__.initialize.call(this, options);
    };

    return Renderer;

  })(BokehView);

  HasProperties = (function(_super) {

    __extends(HasProperties, _super);

    function HasProperties() {
      HasProperties.__super__.constructor.apply(this, arguments);
    }

    HasProperties.prototype.initialize = function(attrs, options) {
      HasProperties.__super__.initialize.call(this, attrs, options);
      this.properties = {};
      this.dependencies = new buckets.MultiDictionary;
      return this.property_cache = {};
    };

    HasProperties.prototype.register_property = function(prop_name, dependencies, property, use_cache) {
      var dep, prop_spec, _i, _len, _results,
        _this = this;
      if (_.has(this.properties, prop_name)) this.remove_property(prop_name);
      prop_spec = {
        'property': property,
        'dependencies': dependencies,
        'use_cache': use_cache,
        'invalidate_cache_callback': function() {
          return _this.clear_cache(prop_name);
        }
      };
      this.properties[prop_name] = prop_spec;
      _results = [];
      for (_i = 0, _len = dependencies.length; _i < _len; _i++) {
        dep = dependencies[_i];
        this.dependencies.set(dep, prop_name);
        if (prop_spec.use_cache) {
          _results.push(this.on("change:" + dep, this.properties[prop_name].invalidate_cache_callback));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    HasProperties.prototype.remove_property = function(prop_name) {
      var dep, dependencies, prop_spec, _i, _len;
      prop_spec = this.properties[prop_name];
      dependencies = prop_spec.dependencies;
      for (_i = 0, _len = dependencies.length; _i < _len; _i++) {
        dep = dependencies[_i];
        this.dependencies.remove(dep, prop_name);
        if (prop_spec.use_cache) {
          this.off("change:" + dep, prop_spec['invalidate_cache_callback']);
        }
      }
      delete this.properties[prop_name];
      if (prop_spec.use_cache) return this.clear_cache(prop_name);
    };

    HasProperties.prototype.has_cache = function(prop_name) {
      return _.has(this.property_cache, prop_name);
    };

    HasProperties.prototype.add_cache = function(prop_name, val) {
      return this.property_cache[prop_name] = val;
    };

    HasProperties.prototype.clear_cache = function(prop_name, val) {
      return delete this.property_cache[prop_name];
    };

    HasProperties.prototype.get_cache = function(prop_name) {
      return this.property_cache[prop_name];
    };

    HasProperties.prototype.get = function(prop_name) {
      var computed, dependencies, prop_spec, property, x;
      if (_.has(this.properties, prop_name)) {
        prop_spec = this.properties[prop_name];
        if (prop_spec.use_cache && this.has_cache(prop_name)) {
          return this.property_cache[prop_name];
        } else {
          dependencies = prop_spec.dependencies;
          property = prop_spec.property;
          dependencies = (function() {
            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = dependencies.length; _i < _len; _i++) {
              x = dependencies[_i];
              _results.push(this.get(x));
            }
            return _results;
          }).call(this);
          computed = property.apply(this, dependencies);
          if (this.properties[prop_name].use_cache) {
            this.add_cache(prop_name, computed);
          }
          return computed;
        }
      } else {
        return HasProperties.__super__.get.call(this, prop_name);
      }
    };

    return HasProperties;

  })(Backbone.Model);

  HasReference = (function(_super) {

    __extends(HasReference, _super);

    function HasReference() {
      HasReference.__super__.constructor.apply(this, arguments);
    }

    HasReference.prototype.type = null;

    HasReference.prototype.initialize = function(attrs, options) {
      HasReference.__super__.initialize.call(this, attrs, options);
      if (!_.has(attrs, 'id')) {
        this.id = _.uniqueId(this.type);
        return this.attributes['id'] = this.id;
      }
    };

    HasReference.prototype.ref = function() {
      return {
        'type': this.type,
        'id': this.id
      };
    };

    HasReference.prototype.resolve_ref = function(ref) {
      return Collections[ref['type']].get(ref['id']);
    };

    HasReference.prototype.get_ref = function(ref_name) {
      var ref;
      ref = this.get(ref_name);
      if (ref) return this.resolve_ref(ref);
    };

    return HasReference;

  })(HasProperties);

  HasParent = (function(_super) {

    __extends(HasParent, _super);

    function HasParent() {
      HasParent.__super__.constructor.apply(this, arguments);
    }

    HasParent.prototype.get_fallback = function(attr) {
      if (this.get_ref('parent') && _.indexOf(this.get_ref('parent').parent_properties, attr) >= 0 && !_.isUndefined(this.get_ref('parent').get(attr))) {
        return this.get_ref('parent').get(attr);
      } else {
        return this.display_defaults[attr];
      }
    };

    HasParent.prototype.get = function(attr) {
      if (!_.isUndefined(HasParent.__super__.get.call(this, attr))) {
        return HasParent.__super__.get.call(this, attr);
      } else if (!(attr === 'parent')) {
        return this.get_fallback(attr);
      }
    };

    HasParent.prototype.display_defaults = {};

    return HasParent;

  })(HasReference);

  Component = (function(_super) {

    __extends(Component, _super);

    function Component() {
      Component.__super__.constructor.apply(this, arguments);
    }

    Component.prototype.defaults = {
      parent: null
    };

    Component.prototype.display_defaults = {
      width: 200,
      height: 200,
      position: 0
    };

    Component.prototype.default_view = null;

    return Component;

  })(HasParent);

  "Utility Classes for vis";

  "Discrete Color Mapper";

  DiscreteColorMapper = (function(_super) {

    __extends(DiscreteColorMapper, _super);

    function DiscreteColorMapper() {
      DiscreteColorMapper.__super__.constructor.apply(this, arguments);
    }

    DiscreteColorMapper.prototype.defaults = {
      colors: ["#1f77b4", "#aec7e8", "#ff7f0e", "#ffbb78", "#2ca02c", "#98df8a", "#d62728", "#ff9896", "#9467bd", "#c5b0d5", "#8c564b", "#c49c94", "#e377c2", "#f7b6d2", "#7f7f7f", "#c7c7c7", "#bcbd22", "#dbdb8d", "#17becf", "#9edae5"],
      range: []
    };

    DiscreteColorMapper.prototype.initialize = function() {};

    DiscreteColorMapper.prototype.map_screen = function(data) {};

    return DiscreteColorMapper;

  })(HasReference);

  Range1d = (function(_super) {

    __extends(Range1d, _super);

    function Range1d() {
      Range1d.__super__.constructor.apply(this, arguments);
    }

    Range1d.prototype.type = 'Range1d';

    Range1d.prototype.defaults = {
      start: 0,
      end: 1
    };

    return Range1d;

  })(HasReference);

  Range1ds = (function(_super) {

    __extends(Range1ds, _super);

    function Range1ds() {
      Range1ds.__super__.constructor.apply(this, arguments);
    }

    Range1ds.prototype.model = Range1d;

    return Range1ds;

  })(Backbone.Collection);

  Mapper = (function(_super) {

    __extends(Mapper, _super);

    function Mapper() {
      Mapper.__super__.constructor.apply(this, arguments);
    }

    Mapper.prototype.defaults = {};

    Mapper.prototype.display_defaults = {};

    Mapper.prototype.map_screen = function(data) {};

    return Mapper;

  })(HasReference);

  LinearMapper = (function(_super) {

    __extends(LinearMapper, _super);

    function LinearMapper() {
      LinearMapper.__super__.constructor.apply(this, arguments);
    }

    LinearMapper.prototype.type = 'LinearMapper';

    LinearMapper.prototype.defaults = {
      data_range: null,
      screen_range: null
    };

    LinearMapper.prototype.calc_scale = function() {
      var domain, range;
      domain = [this.get_ref('data_range').get('start'), this.get_ref('data_range').get('end')];
      range = [this.get_ref('screen_range').get('start'), this.get_ref('screen_range').get('end')];
      console.log([domain, range]);
      return this.scale = d3.scale.linear().domain(domain).range(range);
    };

    LinearMapper.prototype.initialize = function(attrs, options) {
      LinearMapper.__super__.initialize.call(this, attrs, options);
      this.calc_scale();
      this.get_ref('data_range').on('change', this.calc_scale, this);
      return this.get_ref('screen_range').on('change', this.calc_scale, this);
    };

    LinearMapper.prototype.map_screen = function(data) {
      return this.scale(data);
    };

    return LinearMapper;

  })(Mapper);

  LinearMappers = (function(_super) {

    __extends(LinearMappers, _super);

    function LinearMappers() {
      LinearMappers.__super__.constructor.apply(this, arguments);
    }

    LinearMappers.prototype.model = LinearMapper;

    return LinearMappers;

  })(Backbone.Collection);

  "Data Sources";

  ObjectArrayDataSource = (function(_super) {

    __extends(ObjectArrayDataSource, _super);

    function ObjectArrayDataSource() {
      ObjectArrayDataSource.__super__.constructor.apply(this, arguments);
    }

    ObjectArrayDataSource.prototype.type = 'ObjectArrayDataSource';

    ObjectArrayDataSource.prototype.defaults = {
      data: [{}],
      name: 'data'
    };

    ObjectArrayDataSource.prototype.initialize = function(attrs, options) {
      ObjectArrayDataSource.__super__.initialize.call(this, attrs, options);
      return this.ranges = {};
    };

    ObjectArrayDataSource.prototype.compute_range = function(field) {
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

    ObjectArrayDataSource.prototype.get_range = function(field) {
      var max, min, _ref,
        _this = this;
      if (!_.has(this.ranges, field)) {
        _ref = this.compute_range(field), min = _ref[0], max = _ref[1];
        this.ranges[field] = Collections['Range1d'].create({
          'start': min,
          'end': max
        });
        this.on('change:data', function() {
          var _ref2;
          _ref2 = _this.compute_range(field), max = _ref2[0], min = _ref2[1];
          _this.ranges[field].set('start', min);
          return _this.ranges[field].set('end', max);
        });
      }
      return this.ranges[field];
    };

    return ObjectArrayDataSource;

  })(HasReference);

  ObjectArrayDataSources = (function(_super) {

    __extends(ObjectArrayDataSources, _super);

    function ObjectArrayDataSources() {
      ObjectArrayDataSources.__super__.constructor.apply(this, arguments);
    }

    ObjectArrayDataSources.prototype.model = ObjectArrayDataSource;

    return ObjectArrayDataSources;

  })(Backbone.Collection);

  "Individual Components below.\nwe first define the default view for a component,\nthe model for the component, and the collection";

  "Plot Container";

  PlotView = (function(_super) {

    __extends(PlotView, _super);

    function PlotView() {
      PlotView.__super__.constructor.apply(this, arguments);
    }

    PlotView.prototype.initialize = function(options) {
      PlotView.__super__.initialize.call(this, options);
      this.renderers = {};
      this.axes = {};
      this.build_renderers();
      this.build_axes();
      this.render();
      this.model.on('change:renderers', this.build_renderers, this);
      this.model.on('change:axes', this.build_axes, this);
      return this.model.on('change', this.render, this);
    };

    PlotView.prototype.remove = function() {
      return this.model.off(null, null, this);
    };

    PlotView.prototype.build_renderers = function() {
      return this.build_views('renderers', 'renderers');
    };

    PlotView.prototype.build_axes = function() {
      return this.build_views('axes', 'axes');
    };

    PlotView.prototype.build_views = function(storage_attr, spec_attr) {
      var key, model, old_renderers, options, spec, specs, value, view, _i, _len, _len2, _ref, _renderers;
      old_renderers = this[storage_attr];
      _renderers = {};
      specs = this.model.get(spec_attr);
      for (_i = 0, _len = specs.length; _i < _len; _i++) {
        spec = specs[_i];
        model = this.model.resolve_ref(spec);
        if (old_renderers[model.id]) {
          _renderers[model.id] = old_renderers[model.id];
          continue;
        }
        options = _.extend({}, spec.options, {
          'el': this.el,
          'model': model,
          'plot_id': this.id,
          'plot_model': this.model
        });
        view = new model.default_view(options);
        _renderers[model.id] = view;
      }
      _ref = this.renderers;
      for (value = 0, _len2 = _ref.length; value < _len2; value++) {
        key = _ref[value];
        if (!_.has(renderers, key)) value.remove();
      }
      return this[storage_attr] = _renderers;
    };

    PlotView.prototype.render_mainsvg = function() {
      var node;
      node = this.tag_d3('mainsvg');
      if (node === null) {
        node = d3.select(this.el).append('svg').attr('id', this.tag_id('mainsvg'));
        node.append('g').attr('id', this.tag_id('flipY')).append('g').attr('id', this.tag_id('plotcontent'));
      }
      node.attr('width', this.mget('outerwidth')).attr("height", this.mget('outerheight'));
      this.tag_d3('flipY').attr('transform', _.template('translate(0, {{h}}) scale(1, -1)', {
        'h': this.mget('outerheight')
      }));
      return this.tag_d3('plotcontent').attr('transform', _.template('translate({{s}}, {{s}})', {
        's': this.mget('border_space')
      }));
    };

    PlotView.prototype.render_frames = function() {
      var innernode, outernode;
      innernode = this.tag_d3('innerbox');
      outernode = this.tag_d3('outerbox');
      if (innernode === null) {
        innernode = this.tag_d3('plotcontent').append('rect').attr('id', this.tag_id('innerbox'));
        outernode = this.tag_d3('flipY').append('rect').attr('id', this.tag_id('outerbox'));
      }
      outernode.attr('fill', 'none').attr('stroke', this.model.get('foreground_color')).attr('width', this.mget('outerwidth')).attr("height", this.mget('outerheight'));
      return innernode.attr('fill', 'none').attr('stroke', this.model.get('foreground_color')).attr('width', this.mget('width')).attr("height", this.mget('height'));
    };

    PlotView.prototype.render = function() {
      var key, view, _ref, _ref2;
      this.render_mainsvg();
      this.render_frames();
      _ref = this.renderers;
      for (key in _ref) {
        if (!__hasProp.call(_ref, key)) continue;
        view = _ref[key];
        view.render();
      }
      _ref2 = this.axes;
      for (key in _ref2) {
        if (!__hasProp.call(_ref2, key)) continue;
        view = _ref2[key];
        view.render();
      }
      if (!this.model.get_ref('parent')) return this.$el.dialog();
    };

    return PlotView;

  })(BokehView);

  Plot = (function(_super) {

    __extends(Plot, _super);

    function Plot() {
      Plot.__super__.constructor.apply(this, arguments);
    }

    Plot.prototype.type = Plot;

    Plot.prototype.parent_properties = ['backround_color', 'foreground_color', 'width', 'height', 'border_space'];

    Plot.prototype.initialize = function(attrs, options) {
      var _this = this;
      Plot.__super__.initialize.call(this, attrs, options);
      this.register_property('outerwidth', ['width', 'border_space'], function(width, border_space) {
        return width + 2 * border_space;
      }, false);
      this.register_property('outerheight', ['height', 'border_space'], function(height, border_space) {
        return height + 2 * border_space;
      }, false);
      this.xrange = Collections['Range1d'].create({
        'start': 0,
        'end': this.get('height')
      });
      this.yrange = Collections['Range1d'].create({
        'start': 0,
        'end': this.get('width')
      });
      this.on('change:width', function() {
        return _this.xrange.set('end', _this.get('width'));
      });
      return this.on('change:height', function() {
        return _this.yrange.set('end', _this.get('height'));
      });
    };

    return Plot;

  })(Component);

  _.extend(Plot.prototype.defaults, {
    'data_sources': {},
    'renderers': [],
    'axes': [],
    'legends': [],
    'tools': [],
    'overlays': []
  });

  _.extend(Plot.prototype.display_defaults, {
    'backround_color': "#fff",
    'foreground_color': "#333",
    'border_space': 50
  });

  Plots = (function(_super) {

    __extends(Plots, _super);

    function Plots() {
      Plots.__super__.constructor.apply(this, arguments);
    }

    Plots.prototype.model = Plot;

    return Plots;

  })(Backbone.Collection);

  "D3LinearAxisView";

  D3LinearAxisView = (function(_super) {

    __extends(D3LinearAxisView, _super);

    function D3LinearAxisView() {
      D3LinearAxisView.__super__.constructor.apply(this, arguments);
    }

    D3LinearAxisView.prototype.get_offsets = function(position) {
      var offsets;
      offsets = {
        'x': this.plot_model.get('border_space'),
        'y': this.plot_model.get('border_space')
      };
      if (position === 'bottom') offsets['y'] += this.plot_model.get('height');
      return offsets;
    };

    D3LinearAxisView.prototype.render = function() {
      var axis, base, node, offsets;
      base = this.tag_d3('mainsvg', this.plot_id);
      node = this.tag_d3('axis');
      if (!node) {
        node = base.append('g').attr('id', this.tag_id('axis')).attr('class', 'D3LinearAxisView').attr('stroke', this.mget('foreground_color'));
      }
      offsets = this.get_offsets(this.mget('orientation'));
      node.attr('transform', _.template('translate({{x}}, {{y}})', offsets));
      axis = d3.svg.axis();
      axis.scale(this.mget_ref('mapper').scale).orient(this.mget('orientation')).ticks(this.mget('ticks')).tickSubdivide(this.mget('tickSubdivide')).tickSize(this.mget('tickSize')).tickPadding(this.mget('tickPadding'));
      node.call(axis);
      return console.log('AXIS');
    };

    return D3LinearAxisView;

  })(Renderer);

  D3LinearAxis = (function(_super) {

    __extends(D3LinearAxis, _super);

    function D3LinearAxis() {
      D3LinearAxis.__super__.constructor.apply(this, arguments);
    }

    D3LinearAxis.prototype.type = 'D3LinearAxis';

    D3LinearAxis.prototype.default_view = D3LinearAxisView;

    D3LinearAxis.prototype.defaults = {
      mapper: null,
      orientation: 'bottom',
      ticks: 10,
      ticksSubdivide: 1,
      tickSize: 6,
      tickPadding: 3
    };

    return D3LinearAxis;

  })(Component);

  D3LinearAxes = (function(_super) {

    __extends(D3LinearAxes, _super);

    function D3LinearAxes() {
      D3LinearAxes.__super__.constructor.apply(this, arguments);
    }

    D3LinearAxes.prototype.model = D3LinearAxis;

    return D3LinearAxes;

  })(Backbone.Collection);

  ScatterRendererView = (function(_super) {

    __extends(ScatterRendererView, _super);

    function ScatterRendererView() {
      ScatterRendererView.__super__.constructor.apply(this, arguments);
    }

    ScatterRendererView.prototype.render_marks = function(marks) {
      var _this = this;
      return marks.attr('cx', function(d) {
        return _this.model.get_ref('xmapper').map_screen(d[_this.model.get('xfield')]);
      }).attr('cy', function(d) {
        return _this.model.get_ref('ymapper').map_screen(d[_this.model.get('yfield')]);
      }).attr('r', this.model.get('radius')).attr('fill', function(d) {
        if (_this.model.get('color_field')) {
          return _this.model.get_ref('color_mapper').map_screen(d[_this.model.get('color_field')]);
        } else {
          return _this.model.get('foreground_color');
        }
      });
    };

    ScatterRendererView.prototype.render = function() {
      var circles, node, plotcontent;
      plotcontent = this.tag_d3('plotcontent', this.plot_id);
      node = this.tag_d3('scatter');
      if (!node) node = plotcontent.append('g').attr('id', this.tag_id('scatter'));
      circles = node.selectAll(this.model.get('mark')).data(this.model.get_ref('data_source').get('data'));
      this.render_marks(circles);
      this.render_marks(circles.enter().append(this.model.get('mark')));
      return circles.exit().remove();
    };

    return ScatterRendererView;

  })(Renderer);

  ScatterRenderer = (function(_super) {

    __extends(ScatterRenderer, _super);

    function ScatterRenderer() {
      ScatterRenderer.__super__.constructor.apply(this, arguments);
    }

    ScatterRenderer.prototype.type = 'ScatterRenderer';

    ScatterRenderer.prototype.default_view = ScatterRendererView;

    return ScatterRenderer;

  })(Component);

  _.extend(ScatterRenderer.prototype.defaults, {
    data_source: null,
    xmapper: null,
    ymapper: null,
    xfield: null,
    yfield: null,
    colorfield: null,
    mark: 'circle'
  });

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

  })(Backbone.Collection);

  "Convenience plotting functions";

  Bokeh.scatter_plot = function(parent, data_source, xfield, yfield, color_field, mark, colormapper) {
    var plot_attrs, plot_model, plot_view, scatter_plot, source_name, xaxis, xmapper, yaxis, ymapper;
    if (_.isUndefined(mark)) mark = 'circle';
    if (_.isUndefined(color_field)) color_field = null;
    source_name = data_source.get('name');
    plot_attrs = {
      data_sources: {
        source_name: data_source.ref()
      }
    };
    if (parent) plot_attrs['parent'] = parent.get_ref();
    plot_model = Collections['Plot'].create(plot_attrs);
    xmapper = Collections['LinearMapper'].create({
      data_range: data_source.get_range(xfield),
      screen_range: plot_model.xrange.ref()
    });
    ymapper = Collections['LinearMapper'].create({
      data_range: data_source.get_range(yfield),
      screen_range: plot_model.yrange.ref()
    });
    scatter_plot = Collections["ScatterRenderer"].create({
      data_source: data_source.ref(),
      xfield: xfield,
      yfield: yfield,
      color_field: color_field,
      mark: mark,
      xmapper: xmapper.ref(),
      ymapper: ymapper.ref()
    });
    xaxis = Collections['D3LinearAxis'].create({
      'orientation': 'bottom',
      'mapper': xmapper.ref()
    });
    yaxis = Collections['D3LinearAxis'].create({
      'orientation': 'left',
      'mapper': ymapper.ref()
    });
    plot_model.set({
      'renderers': [scatter_plot.ref()],
      'axes': [xaxis.ref(), yaxis.ref()]
    });
    plot_view = new PlotView({
      'model': plot_model
    });
    return plot_view;
  };

  Bokeh.register_collection('Plot', new Plots);

  Bokeh.register_collection('ScatterRenderer', new ScatterRenderers);

  Bokeh.register_collection('ObjectArrayDataSource', new ObjectArrayDataSources);

  Bokeh.register_collection('Range1d', new Range1ds);

  Bokeh.register_collection('LinearMapper', new LinearMappers);

  Bokeh.register_collection('D3LinearAxis', new D3LinearAxes);

  Bokeh.Collections = Collections;

  Bokeh.HasReference = HasReference;

  Bokeh.HasParent = HasParent;

  Bokeh.ObjectArrayDataSource = ObjectArrayDataSource;

  Bokeh.Plot = Plot;

  Bokeh.Component = Component;

  Bokeh.ScatterRenderer = ScatterRenderer;

  Bokeh.BokehView = BokehView;

  Bokeh.PlotView = PlotView;

  Bokeh.ScatterRendererView = ScatterRendererView;

  Bokeh.HasProperties = HasProperties;

  Bokeh.D3LinaerAxis = D3LinearAxis;

}).call(this);
