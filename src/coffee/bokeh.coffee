if this.Bokeh
  Bokeh = this.Bokeh
else
  Bokeh = {}
  this.Bokeh = Bokeh
Collections = Continuum.Collections
Bokeh.register_collection = (key, value) ->
  Collections[key] = value
  value.bokeh_key = key

# MAIN BOKEH CLASSES

# backbone assumes that valid attrs are any non-null, or non-defined value
# thats dumb, we only check for undefined, because null is perfectly valid
safebind = Continuum.safebind
Component = Continuum.Component
BokehView = Continuum.ContinuumView
HasProperties = Continuum.HasProperties

class XYRenderer extends Component

  select : (xscreenbounds, yscreenbounds) ->
    if xscreenbounds
      mapper = @get_ref('xmapper')
      xdatabounds = [mapper.map_data(xscreenbounds[0]),
        mapper.map_data(xscreenbounds[1])]
    else
      xdatabounds = null
    if yscreenbounds
      mapper = @get_ref('ymapper')
      ydatabounds = [mapper.map_data(yscreenbounds[0]),
        mapper.map_data(yscreenbounds[1])]
    else
      ydatabounds = null
    func = (xval, yval) ->
      val = ((xdatabounds is null) or
        (xval > xdatabounds[0] and xval < xdatabounds[1])) and
          ((ydatabounds is null) or
          (yval > ydatabounds[0] and yval < ydatabounds[1]))
      return val
    source = @get_ref('data_source')
    return source.select([@get('xfield'), @get('yfield')], func)


XYRenderer::defaults = _.clone(XYRenderer::defaults)
_.extend(XYRenderer::defaults , {
  xmapper : null
  ymapper : null
  xfield : null
  yfield : null
  data_source : null
  #axes fit here
})


# Utility Classes for vis


class Range1d extends HasProperties
  type : 'Range1d'
Range1d::defaults = _.clone(Range1d::defaults)
_.extend(Range1d::defaults
  ,
    start : 0
    end : 1
)

class Range1ds extends Continuum.Collection
  model : Range1d

class DataRange1d extends Range1d
  type : 'DataRange1d'

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

DataRange1d::defaults = _.clone(DataRange1d::defaults)
_.extend(DataRange1d::defaults
  ,
    sources : []
    rangepadding : 0.1
)

class DataRange1ds extends Continuum.Collection
  model : DataRange1d

class Range1ds extends Continuum.Collection
  model : Range1d


class FactorRange extends HasProperties
  type : 'FactorRange'

FactorRange::defaults = _.clone(FactorRange::defaults)
_.extend(FactorRange::defaults
  ,
    values : []
)


class DataFactorRange extends FactorRange
  type : 'DataFactorRange'
  dinitialize : (attrs, options) ->
    super(attrs, options)
    @register_property('values',
        ['data_source', 'columns'
          ,
            ref : @get('data_source'),
            fields : ['data']
        ]
      ,
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
DataFactorRange::defaults = _.clone(DataFactorRange::defaults)
_.extend(DataFactorRange::defaults
  ,
    values : []
    columns : []
    data_source : null
)

class DataFactorRanges extends Continuum.Collection
  model : DataFactorRange

class FactorRanges extends Continuum.Collection
  model : FactorRange

class Mapper extends HasProperties
  type : 'Mapper'
  map_screen : (data) ->


#  LinearMapper



class LinearMapper extends Mapper
  type : 'LinearMapper'

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
            ref : @get_ref('data_range')
            fields : ['start', 'end']
          ,
            ref : @get_ref('screen_range'),
            fields : ['start', 'end']
        ]
      ,
        () ->
          return @calc_scale()
      , true)
    @register_property('scale_factor', ['scale'], @_scale_factor, true)

  _scale_factor : () ->
    range = @get('scale').range()
    range_width = range[1] - range[0]
    domain = @get('scale').domain()
    domain_width = domain[1] - domain[0]
    return range_width / domain_width

  map_screen : (data) ->
    return @get('scale')(data)

  map_data : (screen) ->
    return @get('scale').invert(screen)

LinearMapper::defaults = _.clone(LinearMapper::defaults)
_.extend(LinearMapper::defaults
  ,
    data_range : null
    screen_range : null
)

class LinearMappers extends Continuum.Collection
  model : LinearMapper


# Discrete Color Mapper

class DiscreteColorMapper extends HasProperties
  type : 'DiscreteColorMapper'
  dinitialize : (attrs, options) ->
    super(attrs, options)
    @register_property('factor_map', ['data_range']
      ,
        () ->
          domain_map = {}
          for val, index in @get('data_range').get('values')
            domain_map[val] = index
          return domain_map
      , true)
    @register_property('scale', ['colors', 'factor_map']
      ,
        () ->
          return d3.scale.ordinal().domain(_.values(@get('factor_map')))
            .range(@get('colors'))
      , true
    )

  map_screen : (data) ->
    @get('scale')(@get('factor_map')[data]);
DiscreteColorMapper::defaults = _.clone(DiscreteColorMapper::defaults)
_.extend(DiscreteColorMapper::defaults
  ,
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
)

class DiscreteColorMappers extends Continuum.Collection
  model : DiscreteColorMapper


# Data Sources

class ObjectArrayDataSource extends HasProperties
  type : 'ObjectArrayDataSource'
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

      @cont_ranges[field] = Collections['Range1d'].create(
          start : min
          end : max
      )
      @on('change:data'
        ,
        () =>
          [max, min] = @compute_cont_range(field)
          @cont_ranges[field].set('start', min)
          @cont_ranges[field].set('end', max)
      )
    return @cont_ranges[field]

  get_discrete_range : (field) ->
    if not _.has(@discrete_ranges, field)
      factors = @compute_discrete_factor(field)
      @discrete_ranges[field] = Collections['FactorRange'].create(
          values : factors
      )
      @on('change:data'
        ,
          () =>
            factors = @compute_discrete_factor(field)
            @discrete_ranges[field] = Collections['FactorRange'].set(
              'values', factors)
      )
    return @discrete_ranges[field]

  select : (fields, func) ->
    selected = []
    for val, idx in @get('data')
      args = (val[x] for x in fields)
      if func.apply(func, args)
        selected.push(idx)
    selected.sort()
    return selected
ObjectArrayDataSource::defaults = _.clone(ObjectArrayDataSource::defaults)
_.extend(ObjectArrayDataSource::defaults
  ,
    data : [{}]
    name : 'data'
    selected : []
    selecting : false
)

class ObjectArrayDataSources extends Continuum.Collection
  model : ObjectArrayDataSource


class GridPlotContainer extends Component
  type : 'GridPlotContainer'
  default_view : GridPlotContainerView
  setup_layout_property : () ->
    dependencies = []
    for row in @get('children')
      for child in row
        dependencies.push(
          ref : child
          fields : ['outerheight', 'outerwidth']
        )
    @register_property('layout', dependencies
      ,
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
    safebind(this, this, 'change:children'
      ,
        ()->
          @remove_property('layout')
          @setup_layout_property()
          @trigger('change:layout', this, @get('layout'))
    )
    @register_property('height', ['layout']
      ,
        () ->
          return _.reduce(@get('layout')[0], ((x,y) -> x+y), 0)
      , true
    )
    @register_property('width', ['layout']
      ,
        () ->
          return _.reduce(@get('layout')[1], ((x,y) -> x+y), 0)
      , true
    )
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
_.extend(GridPlotContainer::defaults
  ,
    resize_children : false
    children : [[]]
    usedialog : false
    border_space : 0
)

class GridPlotContainers extends Continuum.Collection
  model : GridPlotContainer

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
      ['yrange', {'ref' : @get('yrange'), 'fields' : ['start', 'end']}]
      ,
        () ->
          range = @get_ref('yrange')
          return range.get('end') - range.get('start')
      , true
      ,
        (height) =>
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
  'usedialog' : false,
  'title' : 'Plot'
  #axes fit here
})
Plot::display_defaults = _.clone(Plot::display_defaults)
_.extend(Plot::display_defaults
  ,
    background_color : "#eee"
    foreground_color : "#333"
)

class Plots extends Continuum.Collection
   model : Plot



class D3LinearAxis extends Component
  type : 'D3LinearAxis'
  default_view : D3LinearAxisView
  display_defaults :
    tick_color : '#fff'

D3LinearAxis::defaults = _.clone(D3LinearAxis::defaults)
_.extend(D3LinearAxis::defaults
  ,
    mapper : null
    orientation : 'bottom'
    ticks : 10
    ticksSubdivide : 1
    tickSize : null
    tickPadding : 3
)

class D3LinearAxes extends Continuum.Collection
  model : D3LinearAxis


class BarRenderer extends XYRenderer
  type : 'BarRenderer'
  default_view : BarRendererView

BarRenderer::defaults = _.clone(BarRenderer::defaults)
_.extend(BarRenderer::defaults
  ,
    xmapper : null
    ymapper: null
    orientation : 'vertical'
    # orientation determines whether xfield, or yfield will be treated as a domain
    # for continuous fields, we support specifying a field name, the width of
    # the bar in screen space can be specified, or we can calculate a width
    # xstart and xend can be used to specify the width of each bar in data space
    # xfield : {'start' : 'start', 'end' : 'yend'},
    # xfield : {'field' : 'x', width : 10}
    xfield : 'x'
    yfield : 'y'
    color : "#000"
)
class BarRenderers extends Continuum.Collection
  model : BarRenderer


class LineRenderer extends XYRenderer
  type : 'LineRenderer'
  default_view : LineRendererView
LineRenderer::defaults = _.clone(LineRenderer::defaults)
_.extend(LineRenderer::defaults
  ,
    xmapper : null,
    ymapper: null,
    xfield : null,
    yfield : null,
    color : "#000",
)

class LineRenderers extends Continuum.Collection
  model : LineRenderer


class ScatterRenderer extends XYRenderer
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

class ScatterRenderers extends Continuum.Collection
  model : ScatterRenderer



class PanTool extends Continuum.HasParent
  type : "PanTool"
  default_view : PanToolView

PanTool::defaults = _.clone(PanTool::defaults)
_.extend(PanTool::defaults
  ,
    xmappers : []
    ymappers : []
)


class PanTools extends Continuum.Collection
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

  bind_events : (plotview) ->
    @plotview = plotview
    node = @tag_d3('mainsvg', @plot_id)
    node.attr('pointer-events' , 'all')
    node.on("mousewheel.zoom"
      ,
        () =>
          @_zoom()
          d3.event.preventDefault()
          d3.event.stopPropagation()
    )

class ZoomTool extends Continuum.HasParent
  type : "ZoomTool"
  default_view : ZoomToolView
ZoomTool::defaults = _.clone(ZoomTool::defaults)
_.extend(ZoomTool::defaults
  ,
    xmappers : []
    ymappers : []
    speed : 1/600
)

class ZoomTools extends Continuum.Collection
  model : ZoomTool


class SelectionTool extends Continuum.HasParent
  type : "SelectionTool"
  default_view : SelectionToolView

SelectionTool::defaults = _.clone(SelectionTool::defaults)
_.extend(SelectionTool::defaults
  ,
    renderers : []
    select_x : true
    select_y : true
    data_source_options : {} #backbone options for save on datasource
)



class SelectionTools extends Continuum.Collection
  model : SelectionTool

class OverlayView extends PlotWidget
  initialize : (options) ->
    @renderer_ids = options['renderer_ids']
    super(options)

  bind_events : (plotview) ->
    @plotview = plotview
    return null

window.overlay_render = 0
class ScatterSelectionOverlayView extends OverlayView
  request_render : () ->
    super()
  initialize : (options) ->
    super(options)
    for renderer in @mget('renderers')
      renderer = @model.resolve_ref(renderer)
      safebind(this, renderer, 'change', @request_render)
      safebind(this, renderer.get_ref('xmapper'), 'change', @request_render)
      safebind(this, renderer.get_ref('ymapper'), 'change', @request_render)
      safebind(this, renderer.get_ref('data_source'), 'change', @request_render)

  render : () ->
    window.overlay_render += 1
    super()
    for temp in _.zip(@mget('renderers'), @renderer_ids)
      [renderer, viewid] = temp
      renderer = @model.resolve_ref(renderer)
      selected = {}
      if renderer.get_ref('data_source').get('selecting') == false
        #skip data sources which are not selecting'
        continue
      for idx in renderer.get_ref('data_source').get('selected')
        selected[String(idx)] = true
      node = @tag_d3('scatter', viewid)
      node.selectAll(renderer.get('mark')).filter((d, i) =>
        return not selected[String(i)]
      ).attr('fill', @mget('unselected_color'))

      marks = node.selectAll(renderer.get('mark')).filter((d, i) =>
        return selected[String(i)]
      )
      @plotview.renderers[renderer.id].fill_marks(marks)
    return null

class ScatterSelectionOverlay extends Continuum.HasParent
  type : "ScatterSelectionOverlay"
  default_view : ScatterSelectionOverlayView
  defaults :
    renderers : []
    unselected_color : "#ccc"



class ScatterSelectionOverlays extends Continuum.Collection
  model : ScatterSelectionOverlay


#  Convenience plotting functions

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

make_range_and_mapper = (data_source, datafields, padding, screen_range, ordinal, options) ->
    if not ordinal
      range = Collections['DataRange1d'].create(
          sources : [
              ref : data_source.ref()
              columns : datafields
          ]
          rangepadding : padding
        , options
      )
      mapper = Collections['LinearMapper'].create(
          data_range : range.ref()
          screen_range : screen_range.ref()
        , options
      )
    else
      range = Collections['DataFactorRange'].create(
          data_source : data_source.ref()
          columns : [field]
        , options
      )
      mapper = Collections['FactorMapper'].create(
          data_range : range.ref()
          screen_range : screen_range.ref()
        , options
      )
    return [range, mapper]
Bokeh.make_range_and_mapper = make_range_and_mapper

Bokeh.bar_plot = (parent, data_source, xfield, yfield, orientation, local) ->
  if _.isUndefined(local)
    local = true
  options = {'local' : local}
  plot_model = Collections['Plot'].create(
    data_sources :
      source_name : data_source.ref()
    parent : parent
    , options
  )
  [xdr, xmapper] = Bokeh.make_range_and_mapper(data_source, [xfield],
    d3.max([1 / (data_source.get('data').length - 1), 0.1]),
    plot_model.get_ref('xrange'), false, options)

  [ydr, ymapper] = Bokeh.make_range_and_mapper(data_source, [yfield],
    d3.max([1 / (data_source.get('data').length - 1), 0.1]),
    plot_model.get_ref('yrange'), false, options)

  bar_plot = Collections["BarRenderer"].create(
      data_source: data_source.ref()
      xfield : xfield
      yfield : yfield
      xmapper: xmapper.ref()
      ymapper: ymapper.ref()
      parent : plot_model.ref()
      orientation : orientation
    , options
  )
  xaxis = Collections['D3LinearAxis'].create(
      orientation : 'bottom'
      mapper : xmapper.ref()
      parent : plot_model.ref()
    , options
  )
  yaxis = Collections['D3LinearAxis'].create(
      orientation : 'left',
      mapper : ymapper.ref()
      parent : plot_model.ref()
    , options
  )
  plot_model.set(
      renderers : [bar_plot.ref()],
      axes : [xaxis.ref(), yaxis.ref()]
    , options
  )


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
Bokeh.register_collection('BarRenderer', new BarRenderers)
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
Bokeh.register_collection('SelectionTool', new SelectionTools)
Bokeh.register_collection('ScatterSelectionOverlay', new ScatterSelectionOverlays)

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

Bokeh.BarRendererView = BarRendererView
Bokeh.BarRenderers = BarRenderers
Bokeh.BarRenderer = BarRenderer

Bokeh.GridPlotContainerView = GridPlotContainerView
Bokeh.GridPlotContainers = GridPlotContainers
Bokeh.GridPlotContainer = GridPlotContainer

Bokeh.PanTools = PanTools
Bokeh.PanTool = PanTool
Bokeh.PanToolView = PanToolView

Bokeh.ZoomTools = ZoomTools
Bokeh.ZoomTool = ZoomTool
Bokeh.ZoomToolView = ZoomToolView

Bokeh.SelectionTools = SelectionTools
Bokeh.SelectionTool = SelectionTool
Bokeh.SelectionToolView = SelectionToolView

Bokeh.ScatterSelectionOverlays = ScatterSelectionOverlays
Bokeh.ScatterSelectionOverlay = ScatterSelectionOverlay
Bokeh.ScatterSelectionOverlayView = ScatterSelectionOverlayView
