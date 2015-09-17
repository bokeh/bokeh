$ = require "jquery"
_ = require "underscore"
Backbone = require "backbone"
build_views = require "./build_views"
ContinuumView = require "./continuum_view"
HasProperties = require "./has_properties"
{logger} = require "./logging"
widget = require "phosphor-widget"
gridpanel = require "phosphor-gridpanel"
messaging = require "phosphor-messaging"


class PGridView extends ContinuumView
  #className: ""

  initialize: (options) ->
    super(options)
    @views = {}
    
    @panel = new gridpanel.GridPanel()
    @panel.node.style.width = '100%'
    @panel.node.style.height = '100%'
    @panel.node.style.position = 'absolute'
    @el.appendChild(@panel.node)
    # simulate widget.attachWidget(@panel, @el), but allow @el to be unbound to DOM
    # TODO: this not good style, need to call when really attached, render() does not get called enough though. 
    messaging.sendMessage(@panel, widget.MSG_AFTER_ATTACH)
    
    @build_children()
    @bind_bokeh_events()
    @render()
    return this

  bind_bokeh_events: () ->
    @listenTo(@model, 'change:children', @build_children)
    @listenTo(@model, 'change', @render)
    @listenTo(@model, 'destroy', @remove)
    window.addEventListener('resize', () -> box.panel.update())

  build_children: () ->
    # Get views
    child_models = []
    for row in @mget('children')
      for child in row
        if not child?
          continue
        child_models.push(child)
    build_views(@views, child_models, {})
    # Populate grid
    
    irow = -1
    ww = []  # Phosphor-widgets
    for row in @mget('children')
      irow += 1
      icol = -1
      for child in row
        icol += 1
        if not child?
          continue
        w = new widget.Widget()
        w.node.style['margin'] = 'auto'
        w.node.appendChild(@views[child.id].$el[0])
        ww.push(w)
        gridpanel.GridPanel.setRow(w, irow)
        gridpanel.GridPanel.setColumn(w, icol)
        # note: there's also setRowSpan, setColumnSpan
    @panel.children = ww
    
    # Specs
    hspecs = []
    vspecs = []
    for row in @mget('children')
      vspecs.push(new gridpanel.Spec({minSize: 50, sizeBasis: 100, stretch: 0}))
      if hspecs.length == 0
        for child in row
          hspecs.push(new gridpanel.Spec({minSize: 50, sizeBasis: 100, stretch: 0}))
    @panel.rowSpecs = vspecs
    @panel.columnSpecs = hspecs

  render: () ->
    @panel.update()
    return @

class PGrid extends HasProperties
  type: 'PGrid'
  default_view: PGridView

  initialize: (attrs, options) ->
    super(attrs, options)
    @register_property('tool_manager', () ->
      children = []
      for plot in _.flatten(@get('children'))
        if plot?
          children.push(plot)
      new GridToolManager({
        tool_managers: (plot.get('tool_manager') for plot in children)
        toolbar_location: @get('toolbar_location')
        num_plots: children.length
      })
    , true)

  defaults: () ->
    return _.extend {}, super(), {
      children: [[]]
    }

module.exports =
  Model: PGrid
  View: PGridView
