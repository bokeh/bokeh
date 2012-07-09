var BarRendererView, Bokeh, D3LinearAxisView, GridPlotContainerView, LineRendererView, PanToolView, PlotView, PlotWidget, ScatterRendererView, SelectionToolView, build_views,
  __hasProp = Object.prototype.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

if (this.Bokeh) {
  Bokeh = this.Bokeh;
} else {
  Bokeh = {};
  this.Bokeh = Bokeh;
}

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
