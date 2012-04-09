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

# BokehView
# Regular backbone view, except, it gets assigned an id.
# this id can be used to auto-create html ids, and pull out
# d3, and jquery nodes based on those dom elements

class BokehView extends Backbone.View
  initialize : (options) ->
    if not _.has(options, 'id')
      this.id = _.uniqueId('BokehView')

  tag_selector : (tag, id) ->
    return "#" + @tag_id(tag, id)

  tag_id : (tag, id) ->
    if not id
      id = this.id
    tag + "-" + id
  tag_el : (tag, id) ->
    @$el.find("#" + this.tag_id(tag, id))
  tag_d3 : (tag, id) ->
    val = d3.select(this.el).select("#" + this.tag_id(tag, id))
    if val[0][0] == null
      return null
    else
      return val
  mget : (fld)->
    return @model.get(fld)
  mget_ref : (fld) ->
    return @model.get_ref(fld)

class Renderer extends BokehView
  initialize : (options) ->
    @plot_id = options.plot_id
    @plot_model = options.plot_model
    super(options)

# HasReference
# Backbone model, which can output a reference (combination of type, and id)
# also auto creates an id on init, if one isn't passed in.

class HasProperties extends Backbone.Model
  initialize : (attrs, options) ->
    super(attrs, options)
    #property, key is prop name, value is list of dependencies
    #depdencies, key is backbone attribute, multidict value is list of
    #properties that depend on it
    @properties = {}
    @dependencies = new buckets.MultiDictionary
    @property_cache = {}

  register_property : (prop_name, dependencies, property, use_cache) ->
    # remove a property before registering it if we arleady have it
    # store the property function, it's dependencies, whetehr we want to cache it
    # and a callback, which invalidates the cache
    # hook up dependencies data structure,
    # if we're using the cache, register attribute changes on
    # property to invalidate cache for it
    if _.has(@properties, prop_name)
      @remove_property(prop_name)
    prop_spec=
      'property' : property,
      'dependencies' : dependencies,
      'use_cache' : use_cache
      'invalidate_cache_callback' : =>
        @clear_cache(prop_name)
    @properties[prop_name] = prop_spec
    for dep in dependencies
      @dependencies.set(dep, prop_name)
      if prop_spec.use_cache
        @on("change:" + dep, @properties[prop_name].invalidate_cache_callback)

  remove_property : (prop_name) ->
    # remove property from dependency data structure
    # unbind change callbacks if we're using the cache
    # delete the property object from the @properties object
    # clear the cache if we were using it

    prop_spec = @properties[prop_name]
    dependencies = prop_spec.dependencies
    for dep in dependencies
      @dependencies.remove(dep, prop_name)
      if prop_spec.use_cache
        @off("change:" + dep, prop_spec['invalidate_cache_callback'])
    delete @properties[prop_name]
    if prop_spec.use_cache
      @clear_cache(prop_name)

  has_cache : (prop_name) ->
    return _.has(@property_cache, prop_name)

  add_cache : (prop_name, val) ->
    @property_cache[prop_name] = val

  clear_cache : (prop_name, val) ->
    delete @property_cache[prop_name]

  get_cache : (prop_name) ->
    return @property_cache[prop_name]

  get : (prop_name) ->
    if _.has(@properties, prop_name)
      prop_spec = @properties[prop_name]
      if prop_spec.use_cache and @has_cache(prop_name)
        return @property_cache[prop_name]
      else
        dependencies = prop_spec.dependencies
        property = prop_spec.property
        dependencies = (@get(x) for x in dependencies)
        computed = property.apply(this, dependencies)
        if @properties[prop_name].use_cache
          @add_cache(prop_name, computed)
        return computed
    else
      return super(prop_name)

class HasReference extends HasProperties
  type : null
  initialize : (attrs, options) ->
    super(attrs, options)
    if not _.has(attrs, 'id')
      this.id = _.uniqueId(this.type)
      this.attributes['id'] = this.id
  ref : ->
    'type' : this.type
    'id' : this.id
  resolve_ref : (ref) ->
    Collections[ref['type']].get(ref['id'])
  get_ref : (ref_name) ->
    ref = @get(ref_name)
    if ref
      return @resolve_ref(ref)

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
  defaults :
    parent : null
  display_defaults:
    width : 200
    height : 200
    position : 0
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
    console.log([domain, range]);
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

  remove : ->
    @model.off(null, null, this)

  build_renderers : ->
    @build_views('renderers', 'renderers')

  build_axes : ->
    @build_views('axes', 'axes')

  build_views : (storage_attr, spec_attr)->
    old_renderers = this[storage_attr]
    _renderers = {}
    specs = @model.get(spec_attr)
    for spec in specs
      model = @model.resolve_ref(spec)
      if old_renderers[model.id]
        _renderers[model.id] = old_renderers[model.id]
        continue
      options = _.extend({}, spec.options,
        {'el' : @el,
        'model' : model, 'plot_id' : @id, 'plot_model' : @model})
      view = new model.default_view(options)
      _renderers[model.id] = view;
    for own key, value in @renderers
      if not _.has(renderers, key)
        value.remove()
    this[storage_attr] = _renderers

  render_mainsvg : ->
    node = @tag_d3('mainsvg')
    if node == null
      node = d3.select(@el).append('svg')
        .attr('id', @tag_id('mainsvg'))
      node.append('g')
        .attr('id', @tag_id('center'))
        .append('g')
        .attr('id', @tag_id('flipY'))
        .append('g')
        .attr('id', @tag_id('plotcontent'))

    node.attr('width', @mget('outerwidth')).attr("height", @mget('outerheight'))
    #svg puts origin in the top left, we want it on the bottom left
    @tag_d3('center').attr('transform',
      _.template('translate({{s}}, {{s}})', {'s' : @mget('border_space')}))
    @tag_d3('flipY')
      .attr('transform',
        _.template('translate(0, {{h}}) scale(1, -1)',
          {'h' : @mget('height')}))
  render_frames : ->
    innernode = @tag_d3('innerbox')
    outernode = @tag_d3('outerbox')
    if innernode == null
      innernode = @tag_d3('center').insert('rect', @tag_selector('flipY'))
        .attr('id', @tag_id('innerbox'))
      outernode = @tag_d3('mainsvg').append('rect')
        .attr('id', @tag_id('outerbox'))

    outernode.attr('fill', 'none')
      .attr('stroke', @model.get('foreground_color'))
      .attr('width', @mget('outerwidth')).attr("height", @mget('outerheight'))

    innernode.attr('fill', @mget('background_color'))
      .attr('stroke', @model.get('foreground_color'))
      .attr('width', @mget('width')).attr("height", @mget('height'))

  render : ->
    @render_mainsvg();
    @render_frames();
    for own key, view of @axes
      view.render()
    for own key, view of @renderers
      view.render()
    if not @model.get_ref('parent')
      @$el.dialog()

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

  render : ->
    base = @tag_d3('center', @plot_id)
    node = @tag_d3('axis')
    if not node
      node = base.insert('g', @tag_selector('flipY', @plot_id))
        .attr('id', @tag_id('axis'))
        .attr('class', 'D3LinearAxisView')
        .attr('stroke', @mget('foreground_color'))
    offsets = @get_offsets(@mget('orientation'))
    node.attr('transform',
      _.template('translate({{x}}, {{y}})', offsets))
    axis = d3.svg.axis()
    ticksize = @get_tick_size(@mget('orientation'))
    axis.scale(@mget_ref('mapper').scale)
      .orient(@mget('orientation'))
      .ticks(@mget('ticks'))
      .tickSubdivide(@mget('tickSubdivide'))
      .tickSize(ticksize)
      .tickPadding(@mget('tickPadding'))
    node.call(axis)
    node.selectAll('.tick').attr('stroke', @mget('tick_color'))
    console.log('AXIS')

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
    marks.attr('cx', (d) =>
          return @model.get_ref('xmapper').map_screen(d[@model.get('xfield')]))
      .attr('cy', (d) =>
          return @model.get_ref('ymapper').map_screen(d[@model.get('yfield')]))
      .attr('r', @model.get('radius'))
      .attr('fill', (d) =>
        if @model.get('color_field')
          return @model.get_ref('color_mapper')
            .map_screen(d[@model.get('color_field')])
        else
          return @model.get('foreground_color'))

  render : ->
    plotcontent = @tag_d3('plotcontent', this.plot_id)
    node = @tag_d3('scatter')
    if not node
      node = plotcontent.append('g')
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
  plot_attrs =
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
  plot_view = new PlotView({'model' : plot_model});
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
