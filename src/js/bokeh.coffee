if this.Bokeh
  Bokeh = this.Bokeh
else
  Bokeh = {}
  this.Bokeh = Bokeh
Collections = Continuum.Collections
Bokeh.register_collection = (key, value) ->
  Collections[key] = value
  value.bokeh_key = key
"""
  MAIN BOKEH CLASSES
"""
# backbone assumes that valid attrs are any non-null, or non-defined value
# thats dumb, we only check for undefined, because null is perfectly valid
safebind = Continuum.safebind
Component = Continuum.Component
BokehView = Continuum.ContinuumView
HasProperties = Continuum.HasProperties

class PlotWidget extends BokehView
  initialize : (options) ->
    @plot_id = options.plot_id
    @plot_model = options.plot_model
    super(options)

"""
Utility Classes for vis
"""

class Range1d extends HasProperties
  type : 'Range1d'
  defaults :
    start : 0
    end : 1

class Range1ds extends Backbone.Collection
  model : Range1d

class DataRange1d extends Range1d
  type : 'DataRange1d'
  defaults :
    sources : []
    rangepadding : 0.1

  _get_minmax : () ->
    columns = []
    for source in @get('sources')
      sourceobj = @resolve_ref(source['ref'])
      for colname in source['columns']
        columns.push(sourceobj.getcolumn(colname))
    columns = _.reduce(columns, (x, y) -> return x.concat(y))
    [min, max] = [_.min(columns), _.max(columns)]
    span = (max - min) * (1 + @get('rangepadding'))
    center = (max + min) / 2.0
    [min, max] = [center - span/2.0, center + span/2.0]
    return [min, max]

  _get_start : () ->
    if not _.isNullOrUndefined(@get('_start'))
      return @get('_start')
    else
      return @get('minmax')[0]

  _set_start : (start) ->
    @set('_start', start)

  _get_end : () ->
    if not _.isNullOrUndefined(@get('_end'))
      return @get('_end')
    else
      return @get('minmax')[1]

  _set_end : (end) ->
    @set('_end', end)

  dinitialize : (attrs, options) ->
    super(attrs, options)
    deps = ['sources', 'rangepadding']
    for source in @get('sources')
      deps.push({'ref' : source['ref'], 'fields' : ['data']})
    @register_property('minmax', deps, @_get_minmax, true)
    @register_property('start', ['minmax', '_start'],
      @_get_start, true, @_set_start)
    @register_property('end', ['minmax', '_end'],
      @_get_end, true, @_set_end)

class DataRange1ds extends Backbone.Collection
  model : DataRange1d

class Range1ds extends Backbone.Collection
  model : Range1d


class FactorRange extends HasProperties
  type : 'FactorRange'
  defaults :
    values : []

class DataFactorRange extends FactorRange
  type : 'DataFactorRange'
  defaults :
    values : []
    columns : []
    data_source : null
  dinitialize : (attrs, options) ->
    super(attrs, options)
    @register_property('values',
      ['data_source', 'columns',
        {
          'ref' : @get('data_source'),
          'fields' : ['data']
        },
      ],
      () ->
        columns = (@get_ref('data_source').getcolumn(x) for x in @get('columns'))
        columns = _.reduce(columns, (x, y) -> return x.concat(y))
        temp = {}
        for val in columns
          temp[val] = true
        uniques = _.keys(temp)
        uniques = _.sortBy(uniques, ((x) -> return x))
        return uniques
      , true
    )

class DataFactorRanges extends Backbone.Collection
  model : DataFactorRange

class FactorRanges extends Backbone.Collection
  model : FactorRange

class Mapper extends HasProperties
  type : 'Mapper'
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
    return d3.scale.linear().domain(domain).range(range)

  dinitialize : (attrs, options) ->
    super(attrs, options)
    @register_property('scale',
      ['data_range', 'screen_range',
        {
          'ref' : @get_ref('data_range')
          'fields' : ['start', 'end']
        } , {
          'ref' : @get_ref('screen_range'),
          'fields' : ['start', 'end']
        }],
      () ->
        return @calc_scale()
      , true)
  map_screen : (data) ->
    return @get('scale')(data)

  map_data : (screen) ->
    return @get('scale').invert(screen)

class LinearMappers extends Backbone.Collection
  model : LinearMapper

"""
Discrete Color Mapper
"""
class DiscreteColorMapper extends HasProperties
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

  dinitialize : (attrs, options) ->
    super(attrs, options)
    @register_property('factor_map', ['data_range'],
      () ->
        domain_map = {}
        for val, index in @get('data_range').get('values')
          domain_map[val] = index
        return domain_map
      , true)
    @register_property('scale', ['colors', 'factor_map'],
      () ->
        return d3.scale.ordinal().domain(_.values(@get('factor_map')))
          .range(@get('colors'))
      , true
    )

  map_screen : (data) ->
    @get('scale')(@get('factor_map')[data]);

class DiscreteColorMappers extends Backbone.Collection
  model : DiscreteColorMapper

"""
Data Sources
"""
class ObjectArrayDataSource extends HasProperties
  type : 'ObjectArrayDataSource'
  defaults :
    data : [{}]
    name : 'data'
  initialize : (attrs, options) ->
    super(attrs, options)
    @cont_ranges = {}
    @discrete_ranges = {}

  getcolumn: (colname) ->
    return (x[colname] for x in @get('data'))

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

  get_cont_range : (field, padding) ->
    padding = 1.0 if _.isUndefined(padding)
    if not _.has(@cont_ranges, field)
      [min, max] = @compute_cont_range(field)
      span = (max - min) * (1 + padding)
      center = (max + min) / 2.0
      [min, max] = [center - span/2.0, center + span/2.0]

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

class GridPlotContainerView extends BokehView
  initialize : (options) ->
    super(options)
    @childviews = {}
    @build_children()
    @model.on('change:children', @build_children, this);
    @model.on('change', @render, this);
    safebind(this, @model, 'destroy', () =>
      @remove())
    @render()
    return this

  build_children : ->
    node = @build_node()
    childspecs = []
    for row in @mget('children')
      for x in row
        @model.resolve_ref(x).set('usedialog', false)
        childspecs.push(x)
    build_views(@model, @childviews, childspecs, {'el' : @tag_d3('plot')[0][0]})

  build_node : ->
    node = @tag_d3('mainsvg')
    if node == null
      node = d3.select(@el).append('svg').attr('id', @tag_id('mainsvg'))
      node.append('g')
        .attr('id', @tag_id('plot'))
    return node

  render : ->
    node = @build_node()
    @tag_d3('plot').attr('transform',
      _.template('translate({{s}}, {{s}})', {'s' : @mget('border_space')}))

    node.attr('width', @mget('outerwidth'))
      .attr('height', @mget('outerheight'))
      .attr('x', @model.position_x())
      .attr('y', @model.position_y())
    row_heights =  @model.layout_heights()
    col_widths =  @model.layout_widths()
    y_coords = [0]
    _.reduceRight(row_heights[1..], (x, y) ->
        val = x + y
        y_coords.push(val)
        return val
      , 0)
    y_coords.reverse()
    x_coords = [0]
    _.reduce(col_widths[..-1], (x,y) ->
        val = x + y
        x_coords.push(val)
        return val
      , 0)
    for row, ridx in @mget('children')
      for plotspec, cidx in row
        plot = @model.resolve_ref(plotspec)
        @childviews[plot.id].render()
        plot.set({
          'offset' : [x_coords[cidx], y_coords[ridx]],
          'usedialog' : false
        })
    if @mget('usedialog') and not @$el.is(":visible")
      @add_dialog()

class GridPlotContainer extends Component
  type : 'GridPlotContainer'
  default_view : GridPlotContainerView
  setup_layout_property : () ->
    dependencies = []
    for row in @get('children')
      for child in row
        dependencies.push({
          'ref' : child,
          'fields' : ['outerheight', 'outerwidth']
        })
    @register_property('layout', dependencies,
      () ->
        return [@layout_heights(), @layout_widths()]
      , true)

  dinitialize : (attrs, options) ->
    super(attrs, options)
    @setup_layout_property()
    # layout is a special property, if children change, it's dependencies
    # actually change, so we hook it up to outerheight, width changes
    # on the children, and add an additional callback to re-register the prop
    # if children changes
    safebind(this, this, 'change:children',
      ()->
        @remove_property('layout')
        @setup_layout_property()
        @trigger('change:layout', this, @get('layout')))
    @register_property('height', ['layout'],
      () ->
        return _.reduce(@get('layout')[0], ((x,y) -> x+y), 0)
      , true)
    @register_property('width', ['layout'],
      () ->
        return _.reduce(@get('layout')[1], ((x,y) -> x+y), 0)
      , true)
  maxdim : (dim, row) =>
    if row.length == 0
      return 0
    else
      return (_.max((@resolve_ref(x).get(dim) for x in row)))
  layout_heights : ->
    row_heights = (@maxdim('outerheight', row) for row in @get('children'))
    return row_heights

  layout_widths : ->
    maxdim = (dim, row) => (_.max((@resolve_ref(x).get(dim) for x in row)))
    num_cols = @get('children')[0].length
    columns = ((row[n] for row in @get('children')) for n in _.range(num_cols))
    col_widths = (@maxdim('outerwidth', col) for col in columns)
    return col_widths

GridPlotContainer::defaults = _.clone(GridPlotContainer::defaults)
_.extend(GridPlotContainer::defaults , {
  resize_children : false
  children : [[]]
  usedialog : false
  border_space : 0
})

class GridPlotContainers extends Backbone.Collection
  model : GridPlotContainer

class PlotView extends BokehView
  initialize : (options) ->
    super(options)
    @renderers = {}
    @axes = {}
    @tools = {}

    @build_renderers()
    @build_axes()
    @build_tools()

    @render()
    safebind(this, @model, 'change:renderers', @build_renderers)
    safebind(this, @model, 'change:axes', @build_axes)
    safebind(this, @model, 'change:tools', @build_tools)
    safebind(this, @model, 'change', @render)
    safebind(this, @model, 'destroy', () =>
      @remove())
    return this

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

  build_tools : ->
    build_views(@model, @tools, @mget('tools'),
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
      @tag_d3('plot').append('g').attr('id', @tag_id('bg'))
      @tag_d3('plot').append('g').attr('id', @tag_id('fg'))
      @tag_d3('bg')
        .append('rect')
        .attr('id', @tag_id('innerbox'))
      @tag_d3('fg').append('svg').attr('id', @tag_id('plotwindow'))

    if not @mget('usedialog')
      node.attr('x', @model.position_x())
       .attr('y', @model.position_y())
    @tag_d3('innerbox')
      .attr('fill', @mget('background_color'))
      .attr('stroke', @model.get('foreground_color'))
      .attr('width', @mget('width'))
      .attr("height", @mget('height'))
    @tag_d3('plotwindow')
        .attr('height', @mget('height'))
        .attr('width', @mget('width'))
    node.attr('width', @mget('outerwidth')).attr("height", @mget('outerheight'))
    #svg puts origin in the top left, we want it on the bottom left
    @tag_d3('plot').attr('transform',
      _.template('translate({{s}}, {{s}})', {'s' : @mget('border_space')}))

  render : ->
    @render_mainsvg();
    for own key, view of @axes
      view.render()
    for own key, view of @renderers
      view.render()
    for own key, view of @tools
      view.render()
    if @mget('usedialog') and not @$el.is(":visible")
      @add_dialog()

build_views = Continuum.build_views

class Plot extends Component
  initialize : (attrs, options) ->
    super(attrs, options)
    if 'xrange' not of attrs
      @set('xrange',
        @collections['Range1d'].create({'start' : 0, 'end' : 200}, options).ref())
    if 'yrange' not of attrs
      @set('yrange',
        @collections['Range1d'].create({'start' : 0, 'end' : 200}, options).ref())

  dinitialize : (attrs, options) ->
    super(attrs, options)
    @register_property('width',
      ['xrange', {'ref' : @get('xrange'), 'fields' : ['start', 'end']}],
      () ->
        range = @get_ref('xrange')
        return range.get('end') - range.get('start')
      , true
      , (width) =>
          range = @get_ref('xrange')
          range.set('end', range.get('start') + width)
          return null
    )
    @register_property('height',
      ['yrange', {'ref' : @get('yrange'), 'fields' : ['start', 'end']}],
      () ->
        range = @get_ref('yrange')
        return range.get('end') - range.get('start')
      , true
      , (height) =>
          range = @get_ref('yrange')
          range.set('end', range.get('start') + height)
          return null
    )
  type : 'Plot'
  default_view : PlotView
  parent_properties : ['background_color', 'foreground_color',
    'width', 'height', 'border_space']

Plot::defaults = _.clone(Plot::defaults)
_.extend(Plot::defaults , {
  'data_sources' : {},
  'renderers' : [],
  'axes' : [],
  'legends' : [],
  'tools' : [],
  'overlays' : [],
  'usedialog' : false
  #axes fit here
})
Plot::display_defaults = _.clone(Plot::display_defaults)
_.extend(Plot::display_defaults, {
  'background_color' : "#ddd",
  'foreground_color' : "#333",
})

class Plots extends Backbone.Collection
   model : Plot

"""
D3LinearAxisView
"""
class D3LinearAxisView extends PlotWidget
  initialize : (options) ->
    safebind(this, @model, 'change', @render)
    safebind(this, @mget_ref('mapper'), 'change', @render)
    super(options)

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
    base = @tag_d3('bg', @plot_id)
    node = @tag_d3('axis')
    if not node
      node = base.append('g')
        .attr('id', @tag_id('axis'))
        .attr('class', 'D3LinearAxisView')
        .attr('stroke', @mget('foreground_color'))
    offsets = @get_offsets(@mget('orientation'))
    offsets['h'] = @plot_model.get('height')
    node.attr('transform',
      _.template('translate({{x}}, {{y}})', offsets))
    axis = d3.svg.axis()
    ticksize = @get_tick_size(@mget('orientation'))
    scale_converted = @convert_scale(@mget_ref('mapper').get('scale'))
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

class LineRendererView extends PlotWidget
  initialize : (options) ->
    safebind(this, @model, 'change', @render)
    safebind(this, @mget_ref('xmapper'), 'change', @render)
    safebind(this, @mget_ref('ymapper'), 'change', @render)
    safebind(this, @mget_ref('data_source'), 'change', @render)
    super(options)

  render_line : (node) ->
    xmapper = @model.get_ref('xmapper')
    ymapper = @model.get_ref('ymapper')
    xfield = @model.get('xfield')
    yfield = @model.get('yfield')
    line = d3.svg.line()
      .x((d) =>
        pos = xmapper.map_screen(d[xfield])
        return @model.xpos(pos)
      )
      .y((d) =>
        pos = ymapper.map_screen(d[yfield])
        return @model.ypos(pos)
      )
    node.attr('stroke', @mget('color'))
      .attr('d', line)
    node.attr('fill', 'none')

  render : ->
    plot = @tag_d3('plotwindow', this.plot_id)
    node = @tag_d3('line')
    if not node
      node = plot.append('g').attr('id', @tag_id('line'))
    path = node.selectAll('path').data([@model.get_ref('data_source').get('data')])
    @render_line(path)
    @render_line(path.enter().append('path'))

class LineRenderer extends Component
  type : 'LineRenderer'
  default_view : LineRendererView
LineRenderer::defaults = _.clone(LineRenderer::defaults)
_.extend(LineRenderer::defaults, {
    xmapper : null,
    ymapper: null,
    xfield : null,
    yfield : null,
    color : "#000",
})

class LineRenderers extends Backbone.Collection
  model : LineRenderer

class ScatterRendererView extends PlotWidget
  initialize : (options) ->
    super(options)
    safebind(this, @model, 'change', @render)
    safebind(this, @mget_ref('xmapper'), 'change', @render)
    safebind(this, @mget_ref('ymapper'), 'change', @render)
    safebind(this, @mget_ref('data_source'), 'change', @render)

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
    plot = @tag_d3('plotwindow', this.plot_id)
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

ScatterRenderer::defaults = _.clone(ScatterRenderer::defaults)
_.extend(ScatterRenderer::defaults, {
    data_source : null,
    xmapper : null,
    ymapper: null,
    xfield : null,
    yfield : null,
    #if colorfield, we use a color mapper
    colormapper : null,
    colorfield : null,
    mark : 'circle',
})

ScatterRenderer::display_defaults = _.clone(ScatterRenderer::display_defaults)
_.extend(ScatterRenderer::display_defaults, {
  radius : 3
})

class ScatterRenderers extends Backbone.Collection
  model : ScatterRenderer

"""
  tools
"""
class PanToolView extends PlotWidget
  initialize : (options) ->
    @dragging = false
    super(options)

  mouse_coords : () ->
    plot = @tag_d3('plotwindow', @plot_id)
    [x, y] = d3.mouse(plot[0][0])
    [x, y] = [@plot_model.rxpos(x), @plot_model.rypos(y)]
    return [x, y]

  _start_drag_mapper : (mapper) ->
    range = mapper.get_ref('data_range')
    range[@tag_id('start')] = range.get('start')
    range[@tag_id('end')] = range.get('end')

  _start_drag : () ->
    @dragging = true
    [@x, @y] = @mouse_coords()
    xmappers = (@model.resolve_ref(x) for x in @mget('xmappers'))
    ymappers = (@model.resolve_ref(x) for x in @mget('ymappers'))
    for xmap in xmappers
      @_start_drag_mapper(xmap)
    for ymap in ymappers
      @_start_drag_mapper(ymap)

  _drag_mapper : (mapper, diff) ->
    screen_range = mapper.get_ref('screen_range')
    data_range = mapper.get_ref('data_range')
    screenlow = screen_range.get('start') - diff
    screenhigh = screen_range.get('end') - diff
    [start, end] = [mapper.map_data(screenlow), mapper.map_data(screenhigh)]
    data_range.set({
      'start' : start
      'end' : end
    }, {'local' : true})

  _drag : () ->
    plot = @tag_d3('plotwindow', @plot_id)
    [x, y] = @mouse_coords()
    xdiff = x - @x
    ydiff = y - @y
    [@x, @y] = [x, y]
    xmappers = (@model.resolve_ref(x) for x in @mget('xmappers'))
    ymappers = (@model.resolve_ref(x) for x in @mget('ymappers'))
    for xmap in xmappers
      @_drag_mapper(xmap, xdiff)
    for ymap in ymappers
      @_drag_mapper(ymap, ydiff)

  render : () ->
    node = @tag_d3('mainsvg', @plot_id)
    node.attr('pointer-events' , 'all')
    node.on("mousemove.drag",
      () =>
        if d3.event.shiftKey
          if not @dragging
            @_start_drag()
          else
            @_drag()
          d3.event.preventDefault()
          d3.event.stopPropagation()
        else
          @dragging = false
        return null
    )

class PanTool extends Continuum.HasParent
  type : "PanTool"
  default_view : PanToolView
  defaults :
    xmappers : []
    ymappers : []

class PanTools extends Backbone.Collection
  model : PanTool


class ZoomToolView extends PlotWidget
  initialize : (options) ->
    super(options)

  mouse_coords : () ->
    plot = @tag_d3('plotwindow', @plot_id)
    [x, y] = d3.mouse(plot[0][0])
    [x, y] = [@plot_model.rxpos(x), @plot_model.rypos(y)]
    return [x, y]

  _zoom_mapper : (mapper, eventpos, factor) ->
    screen_range = mapper.get_ref('screen_range')
    data_range = mapper.get_ref('data_range')
    screenlow = screen_range.get('start')
    screenhigh = screen_range.get('end')
    start = screenlow - (eventpos - screenlow) * factor
    end = screenhigh + (screenhigh - eventpos) * factor
    [start, end] = [mapper.map_data(start), mapper.map_data(end)]
    console.log([screenlow, screenhigh, start, end])
    data_range.set({
      'start' : start
      'end' : end
    }, {'local' : true})

  _zoom : () ->
    [x, y] = @mouse_coords()
    factor = - @mget('speed') * d3.event.wheelDelta
    xmappers = (@model.resolve_ref(mapper) for mapper in @mget('xmappers'))
    ymappers = (@model.resolve_ref(mapper) for mapper in @mget('ymappers'))
    for xmap in xmappers
      @_zoom_mapper(xmap, x, factor)
    for ymap in ymappers
      @_zoom_mapper(ymap, y, factor)

  render : () ->
    node = @tag_d3('mainsvg', @plot_id)
    node.attr('pointer-events' , 'all')
    node.on("mousewheel.zoom",
      () =>
        @_zoom()
        d3.event.preventDefault()
        d3.event.stopPropagation()
    )

class ZoomTool extends Continuum.HasParent
  type : "ZoomTool"
  default_view : ZoomToolView
  defaults :
    xmappers : []
    ymappers : []
    speed : 1/600

class ZoomTools extends Backbone.Collection
  model : ZoomTool

"""
  Convenience plotting functions
"""
Bokeh.scatter_plot = (parent, data_source, xfield, yfield, color_field, mark, colormapper, local) ->
  if _.isUndefined(local)
    local = true
  options = {'local' : local}
  if _.isUndefined(mark)
    mark = 'circle'
  if _.isUndefined(color_field)
    color_field = null
  if _.isUndefined(color_mapper) and color_field
    color_mapper = Collections['DiscreteColorMapper'].create({
      data_range : Collections['DataFactorRange'].create({
        data_source : data_source.ref()
        columns : ['x']
      }, options)
    }, options)

  source_name = data_source.get('name')
  plot_model = Collections['Plot'].create(
    data_sources :
      source_name : data_source.ref()
    parent : parent
    , options
  )
  xdr = Collections['DataRange1d'].create({
    'sources' : [{'ref' : data_source.ref(), 'columns' : [xfield]}]
  }, options)
  ydr = Collections['DataRange1d'].create({
    'sources' : [{'ref' : data_source.ref(), 'columns' : [yfield]}]
  }, options)
  xmapper = Collections['LinearMapper'].create({
    data_range : xdr.ref()
    screen_range : plot_model.get('xrange')
  }, options)
  ymapper = Collections['LinearMapper'].create({
    data_range : ydr.ref()
    screen_range : plot_model.get('yrange')
  }, options)
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
    , options
  )
  xaxis = Collections['D3LinearAxis'].create({
    'orientation' : 'bottom',
    'mapper' : xmapper.ref()
    'parent' : plot_model.ref()

  }, options)
  yaxis = Collections['D3LinearAxis'].create({
    'orientation' : 'left',
    'mapper' : ymapper.ref()
    'parent' : plot_model.ref()
  }, options)
  plot_model.set({
    'renderers' : [scatter_plot.ref()],
    'axes' : [xaxis.ref(), yaxis.ref()]
  }, options)

Bokeh.line_plot = (parent, data_source, xfield, yfield, local) ->
  if _.isUndefined(local)
    local = true
  options = {'local' : local}
  source_name = data_source.get('name')
  plot_model = Collections['Plot'].create(
    data_sources :
      source_name : data_source.ref()
    parent : parent
    , options
  )
  xdr = Collections['DataRange1d'].create({
    'sources' : [{'ref' : data_source.ref(), 'columns' : [xfield]}]
  }, options)
  ydr = Collections['DataRange1d'].create({
    'sources' : [{'ref' : data_source.ref(), 'columns' : [yfield]}]
  }, options)
  xmapper = Collections['LinearMapper'].create({
    data_range : xdr.ref()
    screen_range : plot_model.get('xrange')
  }, options)
  ymapper = Collections['LinearMapper'].create({
    data_range : ydr.ref()
    screen_range : plot_model.get('yrange')
  }, options)
  line_plot = Collections["LineRenderer"].create(
    data_source: data_source.ref()
    xfield: xfield
    yfield: yfield
    xmapper: xmapper.ref()
    ymapper: ymapper.ref()
    parent : plot_model.ref()
    , options
  )
  xaxis = Collections['D3LinearAxis'].create({
    'orientation' : 'bottom',
    'mapper' : xmapper.ref()
    'parent' : plot_model.ref()
  }, options)
  yaxis = Collections['D3LinearAxis'].create({
    'orientation' : 'left',
    'mapper' : ymapper.ref()
    'parent' : plot_model.ref()
  }, options)
  plot_model.set({
    'renderers' : [line_plot.ref()],
    'axes' : [xaxis.ref(), yaxis.ref()]
  }, options)

#Preparing the name space
Bokeh.register_collection('Plot', new Plots)
Bokeh.register_collection('ScatterRenderer', new ScatterRenderers)
Bokeh.register_collection('LineRenderer', new LineRenderers)
Bokeh.register_collection('ObjectArrayDataSource', new ObjectArrayDataSources)
Bokeh.register_collection('Range1d', new Range1ds)
Bokeh.register_collection('LinearMapper', new LinearMappers)
Bokeh.register_collection('D3LinearAxis', new D3LinearAxes)
Bokeh.register_collection('DiscreteColorMapper', new DiscreteColorMappers)
Bokeh.register_collection('FactorRange', new FactorRanges)
Bokeh.register_collection('GridPlotContainer', new GridPlotContainers)
Bokeh.register_collection('DataRange1d', new DataRange1ds)
Bokeh.register_collection('DataFactorRange', new DataFactorRanges)
Bokeh.register_collection('PanTool', new PanTools)
Bokeh.register_collection('ZoomTool', new ZoomTools)
Bokeh.Collections = Collections
Bokeh.HasProperties = HasProperties
Bokeh.ObjectArrayDataSource = ObjectArrayDataSource
Bokeh.Plot = Plot
Bokeh.Component = Component
Bokeh.ScatterRenderer = ScatterRenderer
Bokeh.BokehView = BokehView
Bokeh.PlotView = PlotView
Bokeh.ScatterRendererView = ScatterRendererView
Bokeh.D3LinearAxis = D3LinearAxis

Bokeh.LineRendererView = LineRendererView
Bokeh.LineRenderers = LineRenderers
Bokeh.LineRenderer = LineRenderer

Bokeh.GridPlotContainerView = GridPlotContainerView
Bokeh.GridPlotContainers = GridPlotContainers
Bokeh.GridPlotContainer = GridPlotContainer

Bokeh.PanTools = PanTools
Bokeh.PanTool = PanTool
Bokeh.PanToolView = PanToolView

Bokeh.ZoomTools = ZoomTools
Bokeh.ZoomTool = ZoomTool
Bokeh.ZoomToolView = ZoomToolView
