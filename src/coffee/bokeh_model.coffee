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
HasParent = Continuum.HasParent
BokehView = Continuum.ContinuumView
HasProperties = Continuum.HasProperties


#should move to bokeh_model.coffee
class Bokeh.LinearMapper extends HasParent
  # XY View state - handles mapper functionality
  # along 2 axes
  initialize : (attrs, options) ->
    super(attrs, options)
    @model = options.model
    @rangename = options.rangename #xdata_range, ydata_range, data_range
    @viewstate = options.viewstate
    @screendim = options.screendim #height or width

    @register_property('scalestate', @_get_scale, true)
    #if height/width changes, updated mapper
    @add_dependencies('scalestate', @viewstate, @screendim)
    #if spec for datarange changes, point to different datarange
    @add_dependencies('scalestate', @model, @rangename)
    #if range limits change, update
    @add_dependencies('scalestate', @model.get_ref(@rangename),
      ['start', 'end'])

  data_range : () ->
    return @model.get_ref(@rangename)

  _get_scale : () ->
    screendim = @viewstate.get(@screendim)
    datarange = @model.get_ref(@rangename)
    scale_factor = @viewstate.get(@screendim)
    scale_factor = scale_factor/(datarange.get('end')-datarange.get('start'))
    offset = -(scale_factor * datarange.get('start'))
    return [scale_factor, offset]

  v_map_screen : (datav) ->
    [scale_factor, offset] = @get('scalestate')
    for data, idx in datav
      datav[idx] = scale_factor * data + offset
    return datav

  map_screen : (data) ->
    [scale_factor, offset] = @get('scalestate')
    return scale_factor * data + offset

  map_data : (screen) ->
    [scale_factor, offset] = @get('scalestate')
    return (screen - offset) / scale_factor

class XYRenderer extends HasParent


XYRenderer::defaults = _.clone(XYRenderer::defaults)
_.extend(XYRenderer::defaults , {
  xmappertype : "linear"
  ymappertype : "linear"
  xdata_range : null
  ydata_range : null
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
    columns = _.reduce(columns, ((x, y) -> return x.concat(y)), [])
    columns = _.filter(columns, (x) -> typeof(x) != "string")
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
    @register_property('minmax', @_get_minmax, true)
    @add_dependencies('minmax', this, ['sources'], ['rangepadding'])
    for source in @get('sources')
      source = @resolve_ref(source.ref)
      @add_dependencies('minmax', source, 'data')
    @register_property('start', @_get_start, true)
    @register_setter('start', @_set_start)
    @add_dependencies('start', this, ['minmax', '_start'])
    @register_property('end', @_get_end, true)
    @register_setter('end', @_set_end)
    @add_dependencies('end', this, ['minmax', '_end'])

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

  _get_values : () ->
    columns = (@get_ref('data_source').getcolumn(x) for x in @get('columns'))
    columns = _.reduce(columns, ((x, y) -> return x.concat(y)), [])
    temp = {}
    for val in columns
      temp[val] = true
    uniques = _.keys(temp)
    uniques = _.sortBy(uniques, ((x) -> return x))
    return uniques

  dinitialize : (attrs, options) ->
    super(attrs, options)
    @register_property
    @register_property('values', @_get_vales, true)
    @add_dependencies('values', this, ['data_source', 'columns'])
    @add_dependencies('values', @get_ref('data_source'),
      ['data_source', 'columns'])


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
    if not _.exists(@cont_ranges, field)
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
    if not _.exists(@discrete_ranges, field)
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

class GridPlotContainer extends HasParent
  type : 'GridPlotContainer'
  default_view : Bokeh.GridPlotContainerView
  setup_layout_property : () ->
    @register_property('layout', () ->
        return [@layout_heights(), @layout_widths()]
      , true)
    dependencies = []
    for row in @get('children')
      for child in row
        @add_dependencies('layout', @resolv_ref(child),
          ['outerheight', 'outerwidth'])

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
    @register_property('height', () ->
        return _.reduce(@get('layout')[0], ((x,y) -> x+y), 0)
      , true
    )
    @add_dependencies('height', this, 'layout')
    @register_property('width', () ->
        return _.reduce(@get('layout')[1], ((x,y) -> x+y), 0)
      , true
    )
    @add_dependencies('width', this, 'layout')
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

class Plot extends HasParent
  type : 'Plot'
  default_view : Bokeh.PlotView
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


class D3LinearAxis extends HasParent
  type : 'D3LinearAxis'
  default_view : Bokeh.D3LinearAxisView
  display_defaults :
    tick_color : '#fff'

D3LinearAxis::defaults = _.clone(D3LinearAxis::defaults)
_.extend(D3LinearAxis::defaults
  ,
    data_range : null
    orientation : 'bottom'
    ticks : 10
    ticksSubdivide : 1
    tickSize : null
    tickPadding : 3
)
class D3LinearAxes extends Continuum.Collection
  model : D3LinearAxis

class D3LinearDateAxis extends D3LinearAxis
  type : "D3LinearDateAxis"
  default_view : Bokeh.D3LinearDateAxisView

class D3LinearDateAxes extends Continuum.Collection
  model : D3LinearDateAxis


class BarRenderer extends XYRenderer
  type : 'BarRenderer'
  default_view : Bokeh.BarRendererView

BarRenderer::defaults = _.clone(BarRenderer::defaults)
_.extend(BarRenderer::defaults
  ,
    xmapper : null
    ymapper: null
    orientation : 'vertical'
    # orientation determines whether xfield, or
    # yfield will be treated as a domain
    # for continuous fields, we support specifying a field name, the width of
    # the bar in screen space can be specified, or we can calculate a width
    # xstart and xend can be used to specify the width of
    # each bar in data space
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
  default_view : Bokeh.LineRendererView
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
  default_view : Bokeh.ScatterRendererView

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
  default_view : Bokeh.PanToolView

PanTool::defaults = _.clone(PanTool::defaults)
_.extend(PanTool::defaults
  ,
    xmappers : []
    ymappers : []
)


class PanTools extends Continuum.Collection
  model : PanTool



class ZoomTool extends Continuum.HasParent
  type : "ZoomTool"
  default_view : Bokeh.ZoomToolView
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
  default_view : Bokeh.SelectionToolView

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


class ScatterSelectionOverlay extends Continuum.HasParent
  type : "ScatterSelectionOverlay"
  default_view : Bokeh.ScatterSelectionOverlayView
  defaults :
    renderers : []
    unselected_color : "#ccc"



class ScatterSelectionOverlays extends Continuum.Collection
  model : ScatterSelectionOverlay



#Preparing the name space
Bokeh.register_collection('Plot', new Plots)
Bokeh.register_collection('ScatterRenderer', new ScatterRenderers)
Bokeh.register_collection('LineRenderer', new LineRenderers)
Bokeh.register_collection('BarRenderer', new BarRenderers)
Bokeh.register_collection('ObjectArrayDataSource', new ObjectArrayDataSources)
Bokeh.register_collection('Range1d', new Range1ds)
Bokeh.register_collection('D3LinearAxis', new D3LinearAxes)
Bokeh.register_collection('D3LinearDateAxis', new D3LinearDateAxes)
#Bokeh.register_collection('DiscreteColorMapper', new DiscreteColorMappers)
Bokeh.register_collection('FactorRange', new FactorRanges)
Bokeh.register_collection('GridPlotContainer', new GridPlotContainers)
Bokeh.register_collection('DataRange1d', new DataRange1ds)
Bokeh.register_collection('DataFactorRange', new DataFactorRanges)
Bokeh.register_collection('PanTool', new PanTools)
Bokeh.register_collection('ZoomTool', new ZoomTools)
Bokeh.register_collection('SelectionTool', new SelectionTools)
Bokeh.register_collection('ScatterSelectionOverlay', new ScatterSelectionOverlays)


Bokeh.Collections = Collections
Bokeh.ObjectArrayDataSource = ObjectArrayDataSource
Bokeh.Plot = Plot
Bokeh.ScatterRenderer = ScatterRenderer
Bokeh.D3LinearAxis = D3LinearAxis

Bokeh.LineRenderers = LineRenderers
Bokeh.LineRenderer = LineRenderer

Bokeh.BarRenderers = BarRenderers
Bokeh.BarRenderer = BarRenderer

Bokeh.GridPlotContainers = GridPlotContainers
Bokeh.GridPlotContainer = GridPlotContainer

Bokeh.PanTools = PanTools
Bokeh.PanTool = PanTool

Bokeh.ZoomTools = ZoomTools
Bokeh.ZoomTool = ZoomTool

Bokeh.SelectionTools = SelectionTools
Bokeh.SelectionTool = SelectionTool

Bokeh.ScatterSelectionOverlays = ScatterSelectionOverlays
Bokeh.ScatterSelectionOverlay = ScatterSelectionOverlay
