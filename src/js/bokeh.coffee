if this.Bokeh
  Bokeh = this.Bokeh
else
  Bokeh = {}
  this.Bokeh = Bokeh
Collections = {}
Bokeh.register_collection = (key, value) ->
  Collections[key] = value
  value.bokeh_key = key
"""
  MAIN BOKEH CLASSES
"""
# backbone assumes that valid attrs are any non-null, or non-defined value
# thats dumb, we only check for undefined, because null is perfectly valid
class BokehView extends Continuum.ContinuumView


HasProperties = Continuum.HasProperties
class HasReference extends Continuum.HasReference
  collections : Collections

class Renderer extends BokehView
  initialize : (options) ->
    @plot_id = options.plot_id
    @plot_model = options.plot_model
    super(options)


# hasparent
# display_options can be passed down to children
# defaults for display_options should be placed
# in a class var display_defaults
# the get function, will resolve an instances defaults first
# then check the parents actual val, and finally check class defaults.
# display options cannot go into defaults

class HasParent extends HasReference
  get_fallback : (attr) ->
    if (@get_ref('parent') and
        _.indexOf(@get_ref('parent').parent_properties, attr) >= 0 and
        not _.isUndefined(@get_ref('parent').get(attr)))
      return @get_ref('parent').get(attr)
    else
      return @display_defaults[attr]
  get : (attr) ->
    ## no fallback for 'parent'
    if not _.isUndefined(super(attr))
      return super(attr)
    else if not (attr == 'parent')
      return @get_fallback(attr)

  display_defaults : {}

class Component extends HasParent
  xpos : (x) ->
    return x
  ypos : (y) ->
    return @get('height') - y
  initialize : (attrs, options) ->
    super(attrs, options)
    @register_property('outerwidth', ['width', 'border_space'],
      (width, border_space) -> width + 2 *border_space
      false)
    @register_property('outerheight', ['height', 'border_space'],
      (height, border_space) -> height + 2 *border_space
      false)
  defaults :
    parent : null
  display_defaults:
    width : 200
    height : 200
    position : 0
    offset : []
  default_view : null

"""
Utility Classes for vis
"""

class Range1d extends HasReference
  type : 'Range1d'
  defaults :
    start : 0
    end : 1

class Range1ds extends Backbone.Collection
  model : Range1d

class FactorRange extends HasReference
  type : 'FactorRange'
  defaults :
    values : []

class FactorRanges extends Backbone.Collection
  model : FactorRange

class Mapper extends HasReference
  defaults : {}
  display_defaults : {}
  map_screen : (data) ->

"""
  LinearMapper
"""
class LinearMapper extends Mapper
  type : 'LinearMapper'
  defaults :
    data_range : null
    screen_range : null

  calc_scale : ->
    domain = [@get_ref('data_range').get('start'),
      @get_ref('data_range').get('end')]
    range = [@get_ref('screen_range').get('start'),
      @get_ref('screen_range').get('end')]
    @scale = d3.scale.linear().domain(domain).range(range)

  initialize : (attrs, options) ->
    super(attrs, options)
    @calc_scale()
    @get_ref('data_range').on('change', @calc_scale, this)
    @get_ref('screen_range').on('change', @calc_scale, this)

  map_screen : (data) ->
    return @scale(data)

class LinearMappers extends Backbone.Collection
  model : LinearMapper

"""
Discrete Color Mapper
"""
class DiscreteColorMapper extends HasReference
  type : 'DiscreteColorMapper'
  defaults :
    #d3_category20
    colors : [
      "#1f77b4", "#aec7e8",
      "#ff7f0e", "#ffbb78",
      "#2ca02c", "#98df8a",
      "#d62728", "#ff9896",
      "#9467bd", "#c5b0d5",
      "#8c564b", "#c49c94",
      "#e377c2", "#f7b6d2",
      "#7f7f7f", "#c7c7c7",
      "#bcbd22", "#dbdb8d",
      "#17becf", "#9edae5"
    ],
    data_range : null
  initialize : (attrs, options) ->
    super(attrs, options)
    @get('data_range')
    @register_property('factor_map', ['data_range'],
      (data_range) ->
        domain_map = {}
        for val, index in data_range.get('values')
          domain_map[val] = index
        return domain_map
      , true)
    @scale = d3.scale.ordinal().range(@get('colors'));

  map_screen : (data) ->
    @scale(@get('factor_map')[data]);

class DiscreteColorMappers extends Backbone.Collection
  model : DiscreteColorMapper

"""
Data Sources
"""
class ObjectArrayDataSource extends HasReference
  type : 'ObjectArrayDataSource'
  defaults :
    data : [{}]
    name : 'data'
  initialize : (attrs, options) ->
    super(attrs, options)
    @cont_ranges = {}
    @discrete_ranges = {}

  compute_cont_range : (field) ->
    max = _.max((x[field] for x in @get('data')))
    min = _.min((x[field] for x in @get('data')))
    return [min, max]

  compute_discrete_factor : (field) ->
    temp = {}
    for val in (x[field] for x in @get('data'))
      temp[val] = true
    uniques = _.keys(temp)
    uniques = _.sortBy(uniques, ((x) -> return x))

  get_cont_range : (field) ->
    if not _.has(@cont_ranges, field)
      [min, max] = @compute_cont_range(field)
      @cont_ranges[field] = Collections['Range1d'].create({
        'start' : min,
        'end' : max})
      @on('change:data', =>
        [max, min] = @compute_cont_range(field)
        @cont_ranges[field].set('start', min)
        @cont_ranges[field].set('end', max))
    return @cont_ranges[field]

  get_discrete_range : (field) ->
    if not _.has(@discrete_ranges, field)
      factors = @compute_discrete_factor(field)
      @discrete_ranges[field] = Collections['FactorRange'].create({
        values : factors
      })
      @on('change:data', =>
        factors = @compute_discrete_factor(field)
        @discrete_ranges[field] = Collections['FactorRange'].set('values', factors)
      )
    return @discrete_ranges[field]

class ObjectArrayDataSources extends Backbone.Collection
  model : ObjectArrayDataSource

"""
  Individual Components below.
  we first define the default view for a component,
  the model for the component, and the collection
"""
"""
  Plot Container
"""
class PlotView extends BokehView
  initialize : (options) ->
    super(options)
    @renderers = {}
    @axes = {}

    @build_renderers()
    @build_axes()
    @render()

    @model.on('change:renderers', @build_renderers, this);
    @model.on('change:axes', @build_axes, this);
    @model.on('change', @render, this);

  build_renderers : ->
    build_views(@model, @renderers, @mget('renderers'),
      {'el' : @el,
      'plot_id' : @id,
      'plot_model' : @model})

  build_axes : ->
    build_views(@model, @axes, @mget('axes'),
      {'el' : @el,
      'plot_id' : @id,
      'plot_model' : @model})

  render_mainsvg : ->
    node = @tag_d3('mainsvg')
    if node == null
      node = d3.select(@el).append('svg')
        .attr('id', @tag_id('mainsvg'))
      node.append('g')
        .attr('id', @tag_id('plot'))
    node.attr('width', @mget('outerwidth')).attr("height", @mget('outerheight'))
    #svg puts origin in the top left, we want it on the bottom left
    @tag_d3('plot').attr('transform',
      _.template('translate({{s}}, {{s}})', {'s' : @mget('border_space')}))

  render_frame : ->
    innernode = @tag_d3('innerbox')
    if innernode == null
      innernode = @tag_d3('plot').append('rect')
        .attr('id', @tag_id('innerbox'))
    innernode.attr('fill', @mget('background_color'))
      .attr('stroke', @model.get('foreground_color'))
      .attr('width', @mget('width')).attr("height", @mget('height'))

  render : ->
    @render_mainsvg();
    @render_frame();
    for own key, view of @axes
      view.render()
    for own key, view of @renderers
      view.render()
    if not @model.get_ref('parent')
      @$el.dialog(
        close :  () =>
          @remove()
      )

build_views = (builder, view_storage, view_specs, options) ->
  #create a view for each view spec, store it in view_storage
  #remove anything from view_storage which isn't present in view_spec
  #option parameter are passed to views
  found = {}
  for spec in view_specs
    model = builder.resolve_ref(spec)
    found[model.id] = true
    if view_storage[model.id]
      continue
    options = _.extend({}, spec.options, options, {'model' : model})
    view_storage[model.id] = new model.default_view(options)
  for own key, value in view_storage
    if not _.has(found, key)
      value.remove()
      delete view_storage[key]

class GridPlotContainer extends Component
  type : 'GridPlotContainer'

_.extend(GridPlotContainer::defaults , {
  'resize_children' : false
  'children' : [[]]
})

class GridPlotContainerView extends BokehView
  layout_dimensions : ->
    maxdim = (dim, row) -> (_.max((x.mget(dim) for x in row)))
    row_heights = (maxdim('height', row) for row in @mget('children'))
    num_cols = @mget('children')[0].length
    columns = ((row(n) for row in @mget('children')) for n in _.range(num_cols))
    col_widths = (maxdim('width', col) for col in columns)
    return [row_heights, col_widths]

  # render : ->
  #   node = @tag_d3('svg')
  #   if node == null
  #     node = d3.select(@el).append('svg').attr('id', @tag_id('mainsvg'))

  #   row_heights, col_widths = @layout_dimensions()
  #   y_coords = _.reduceRight(row_heights, (x, y) -> return x + y)
  #   x_coords = _.reduce(col_widths, (x,y) -> return x + y)
  #   for row, ridx in @mget('children')
  #     for plotspec, cidx in row
  #       plot = @resolve_ref(plotspec)
  #       options = _.extend({}, plotspec.options)
  #       view = new plot.default_view({
  #         'el' : @el,
  #         'model' : plot
  #       })







class Plot extends Component
  type : 'Plot'
  parent_properties : ['background_color', 'foreground_color',
    'width', 'height', 'border_space']
  initialize : (attrs, options) ->
    super(attrs, options)
    @register_property('outerwidth', ['width', 'border_space'],
      (width, border_space) -> width + 2 *border_space
      false)
    @register_property('outerheight', ['height', 'border_space'],
      (height, border_space) -> height + 2 *border_space
      false)
    @xrange = Collections['Range1d'].create({'start' : 0, 'end' : @get('height')})
    @yrange = Collections['Range1d'].create({'start' : 0, 'end' : @get('width')})
    @on('change:width', =>
      @xrange.set('end', @get('width')))
    @on('change:height', =>
      @yrange.set('end', @get('height')))

_.extend(Plot::defaults , {
  'data_sources' : {},
  'renderers' : [],
  'axes' : [],
  'legends' : [],
  'tools' : [],
  'overlays' : []
  #axes fit here
})

_.extend(Plot::display_defaults, {
  'background_color' : "#ddd",
  'foreground_color' : "#333",
  'border_space' : 50
})

class Plots extends Backbone.Collection
   model : Plot

"""
D3LinearAxisView
"""
class D3LinearAxisView extends Renderer
  get_offsets : (orientation) ->
    offsets =
      'x' : 0
      'y' : 0
    if orientation == 'bottom'
      offsets['y'] += @plot_model.get('height')
    return offsets

  get_tick_size : (orientation) ->
    if (not _.isNull(@mget('tickSize')))
      return @mget('tickSize')
    else
      if orientation == 'bottom'
        return -@plot_model.get('height')
      else
        return -@plot_model.get('width')

  convert_scale : (scale) ->
    domain = scale.domain()
    range = scale.range()
    if @mget('orientation') in ['bottom', 'top']
      func = 'xpos'
    else
      func = 'ypos'
    range = [@plot_model[func](range[0]), @plot_model[func](range[1])]
    scale = d3.scale.linear().domain(domain).range(range)
    return scale

  render : ->
    base = @tag_d3('plot', @plot_id)
    node = @tag_d3('axis')
    if not node
      node = base.append('g', @tag_selector('plot', @plot_id))
        .attr('id', @tag_id('axis'))
        .attr('class', 'D3LinearAxisView')
        .attr('stroke', @mget('foreground_color'))
    offsets = @get_offsets(@mget('orientation'))
    offsets['h'] = @plot_model.get('height')
    node.attr('transform',
      _.template('translate({{x}}, {{y}})', offsets))
    axis = d3.svg.axis()
    ticksize = @get_tick_size(@mget('orientation'))
    scale_converted = @convert_scale(@mget_ref('mapper').scale)
    temp = axis.scale(scale_converted)
    temp.orient(@mget('orientation'))
      .ticks(@mget('ticks'))
      .tickSubdivide(@mget('tickSubdivide'))
      .tickSize(ticksize)
      .tickPadding(@mget('tickPadding'))
    node.call(axis)
    node.selectAll('.tick').attr('stroke', @mget('tick_color'))

class D3LinearAxis extends Component
  type : 'D3LinearAxis'
  default_view : D3LinearAxisView
  defaults :
    mapper : null
    orientation : 'bottom'
    ticks : 10
    ticksSubdivide : 1
    tickSize : null
    tickPadding : 3
  display_defaults :
    tick_color : '#fff'

class D3LinearAxes extends Backbone.Collection
  model : D3LinearAxis

class ScatterRendererView extends Renderer
  render_marks : (marks) ->
    xmapper = @model.get_ref('xmapper')
    ymapper = @model.get_ref('ymapper')
    xfield = @model.get('xfield')
    yfield = @model.get('yfield')

    marks.attr('cx', (d) =>
        pos = xmapper.map_screen(d[xfield])
        return @model.xpos(pos)
      )
      .attr('cy', (d) =>
        pos = ymapper.map_screen(d[yfield])
        return @model.ypos(pos)
      )
      .attr('r', @model.get('radius'))
      .attr('fill', (d) =>
        if @model.get('color_field')
          return @model.get_ref('color_mapper')
            .map_screen(d[@model.get('color_field')])
        else
          return @model.get('foreground_color'))

  render : ->
    plot = @tag_d3('plot', this.plot_id)
    node = @tag_d3('scatter')
    if not node
      node = plot.append('g')
      .attr('id', @tag_id('scatter'))

    circles = node.selectAll(@model.get('mark'))
      .data(@model.get_ref('data_source').get('data'))
    @render_marks(circles)
    @render_marks(circles.enter().append(@model.get('mark')))
    circles.exit().remove();

class ScatterRenderer extends Component
  type : 'ScatterRenderer'
  default_view : ScatterRendererView

_.extend(ScatterRenderer::defaults, {
    data_source : null,
    xmapper : null,
    ymapper: null,
    xfield : null,
    yfield : null,
    colorfield : null,
    mark : 'circle',
})

_.extend(ScatterRenderer::display_defaults, {
  radius : 3
})

class ScatterRenderers extends Backbone.Collection
  model : ScatterRenderer
"""
  Convenience plotting functions
"""
Bokeh.scatter_plot = (parent, data_source, xfield, yfield, color_field, mark, colormapper) ->
  if _.isUndefined(mark)
    mark = 'circle'
  if _.isUndefined(color_field)
    color_field = null
  if _.isUndefined(color_mapper) and color_field
    color_mapper = Collections['DiscreteColorMapper'].create({
      data_range : data_source.get_discrete_range(color_field)
    }).ref()

  source_name = data_source.get('name')
  plot_model = Collections['Plot'].create(
    data_sources :
      source_name : data_source.ref()
    parent : parent
  )
  xmapper = Collections['LinearMapper'].create({
    data_range : data_source.get_cont_range(xfield)
    screen_range : plot_model.xrange.ref()
  })
  ymapper = Collections['LinearMapper'].create({
    data_range : data_source.get_cont_range(yfield)
    screen_range : plot_model.yrange.ref()
  })
  scatter_attrs =
  scatter_plot = Collections["ScatterRenderer"].create(
    data_source: data_source.ref()
    xfield: xfield
    yfield: yfield
    color_field: color_field
    color_mapper : color_mapper
    mark: mark
    xmapper: xmapper.ref()
    ymapper: ymapper.ref()
    parent : plot_model.ref()
  )
  xaxis = Collections['D3LinearAxis'].create({
    'orientation' : 'bottom',
    'mapper' : xmapper.ref()
    'parent' : plot_model.ref()
  })
  yaxis = Collections['D3LinearAxis'].create({
    'orientation' : 'left',
    'mapper' : ymapper.ref()
    'parent' : plot_model.ref()
  })
  plot_model.set({
    'renderers' : [scatter_plot.ref()],
    'axes' : [xaxis.ref(), yaxis.ref()]
  })
  plot_view = new PlotView({
    'model' : plot_model,
  });
  return plot_view

#Preparing the name space
Bokeh.register_collection('Plot', new Plots)
Bokeh.register_collection('ScatterRenderer', new ScatterRenderers)
Bokeh.register_collection('ObjectArrayDataSource', new ObjectArrayDataSources)
Bokeh.register_collection('Range1d', new Range1ds)
Bokeh.register_collection('LinearMapper', new LinearMappers)
Bokeh.register_collection('D3LinearAxis', new D3LinearAxes)
Bokeh.register_collection('DiscreteColorMapper', new DiscreteColorMappers)
Bokeh.register_collection('FactorRange', new FactorRanges)

Bokeh.Collections = Collections
Bokeh.HasReference = HasReference
Bokeh.HasParent = HasParent
Bokeh.ObjectArrayDataSource = ObjectArrayDataSource
Bokeh.Plot = Plot
Bokeh.Component = Component
Bokeh.ScatterRenderer = ScatterRenderer
Bokeh.BokehView = BokehView
Bokeh.PlotView = PlotView
Bokeh.ScatterRendererView = ScatterRendererView
Bokeh.HasProperties = HasProperties
Bokeh.D3LinaerAxis = D3LinearAxis
