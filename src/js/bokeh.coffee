if this.Bokeh
  Bokeh = this.Bokeh
else
  Bokeh = {}
  this.Bokeh = Bokeh
Collections = {}
Bokeh.register_collection = (key, value) ->
  Collections[key] = value
  value.bokeh_key = key

# BokehView
# Regular backbone view, except, it gets assigned an id.
# this id can be used to auto-create html ids, and pull out
# d3, and jquery nodes based on those dom elements
class BokehView extends Backbone.View
  initialize : (options) ->
    if not _.has(options, 'id')
      this.id = _.uniqueId('BokehView')
  tag_id : (tag) ->
    "tag" + "-" + this.id
  tag_el : (tag) ->
    $("#" + this.tag_id())
  tag_d3 : (tag) ->
    d3.select("#" + this.tag_id())
# HasReference
# Backbone model, which can output a reference (combination of type, and id)
# also auto creates an id on init, if one isn't passed in.

class HasReference extends Backbone.Model
  type : null
  initialize : (attrs, options) ->
    if not _.has(attrs, 'id')
      this.id = _.uniqueId(this.type)
      this.attributes['id'] = this.id
  ref : ->
    'type' : this.type
    'id' : this.id
  resolve_ref : (ref) ->
    Collections[ref['type']].get(ref['id'])
  get_ref : (ref_name) ->
    this.resolve_ref(this.get(ref_name))

# hasparent
# display_options can be passed down to children
# defaults for display_options should be placed
# in a class var display_defaults
# the get function, will resolve an instances defaults first
# then check the parents actual val, and finally check class defaults.
# display options cannot go into defaults

class HasParent extends HasReference
  initialize : (attrs, options) ->
    super(attrs, options)
    if not _.isNullOrUndefined(attrs['parent'])
      @parent = @get_ref('parent')
  get : (attr) ->
    if _.has(@attributes, attr)
      return @attributes[attr]
    else if (not _.isUndefined(@parent) and
            _.indexOf(@parent.parent_properties, attr) >= 0 and
            not _.isUndefined(@parent.get(attr)))
      return @parent.get(attr)
    else
      return @display_defaults[attr]
  display_defaults : {}

class Component extends HasParent
  defaults :
    parent : null
  display_defaults:
    width : 200
    height : 200
    position : 0
  default_view : null

class Plot extends Component
  type : Plot

_.extend(Plot::defaults , {
    'data_sources' : {},
    'renderers' : [],
    'legends' : [],
    'tools' : [],
    'overlays' : []
})

_.extend(Plot::display_defaults, {
  'background-color' : "#fff",
  'foreground-color' : "#aaa"
})

class PlotView extends BokehView
  initialize : (options) ->
    super(options)
    @renderers = {}
    for spec in @model.get('renderers')
      model = Collections[spec.type].get(spec.id)
      options = _.extend({},
        spec.options,
        {'el' : @el,
        'model' : model}
      )
      view = new model.default_view(options)
      @renderers[view.id] = view;
    null
  render : ->
    [height, width] = [@model.get('height'), @model.get('width')]
    d3.select(@el).append('svg')
      .attr('width', width)
      .attr("height", height)
  		.append('rect')
  		.attr('fill', @model.get('background-color'))
  		.attr('stroke', @model.get('foreground-color'))
  		.attr("width", width)
  		.attr("height", height);
    for own key, view of @renderers
      view.render()
    if not @model.parent
      @$el.dialog()

class Range1d extends HasReference
  type : 'Range1d'
  defaults :
    start : 0
    end : 1

class Mapper extends HasReference
  defaults : {}
  display_defaults : {}
  map_screen : (data) ->

class LinearMapper extends Mapper
  type : 'LinearMapper'
  defaults :
    data_range : null
    screen_range : null
  initialize : (attrs, options) ->
    super(attrs, options)
    domain = [@get_ref('data_range').get('start'),
      @get_ref('data_range').get('end')]
    range = [@get_ref('screen_range').get('start'),
      @get_ref('screen_range').get('end')]
    @scale = d3.scale.linear().domain(domain).range(range)

  map_screen : (data) ->
    return @scale(data)

class ScatterRendererView extends BokehView
  render : ->
    svg = d3.select(@el).select('svg').append('g')
      .attr('id', @tag_id('g'))
      .selectAll(@model.get('mark'))
      .data(@model.get_ref('data_source').get('data'))
      .enter()
      .append(@model.get('mark'))
      .attr('cx', (d) =>
          return @model.get_ref('xmapper').map_screen(d[@model.get('xfield')]))
      .attr('cy', (d) =>
          return @model.get_ref('ymapper').map_screen(d[@model.get('yfield')]))
      .attr('r', @model.get('radius'))
      .attr('fill', @model.get('foreground-color'))

class ScatterRenderer extends Component
  type : 'ScatterRenderer'
  default_view : ScatterRendererView

_.extend(ScatterRenderer::defaults, {
    data_source : null,
    xmapper : null,
    ymapper: null,
    xfield : '',
    yfield : '',
    mark : 'circle',
})

_.extend(ScatterRenderer::display_defaults, {
  radius : 3
})

class ObjectArrayDataSource extends HasReference
  type : 'ObjectArrayDataSource'
  defaults :
    data : [{}]

class Plots extends Backbone.Collection
   model : Plot
   url : "/"

class ScatterRenderers extends Backbone.Collection
  model : ScatterRenderer

class ObjectArrayDataSources extends Backbone.Collection
  model : ObjectArrayDataSource

class Range1ds extends Backbone.Collection
  model : Range1d

class LinearMappers extends Backbone.Collection
  model : LinearMapper

Bokeh.register_collection('Plot', new Plots)
Bokeh.register_collection('ScatterRenderer', new ScatterRenderers)
Bokeh.register_collection('ObjectArrayDataSource', new ObjectArrayDataSources)
Bokeh.register_collection('Range1d', new Range1ds)
Bokeh.register_collection('LinearMapper', new LinearMappers)

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