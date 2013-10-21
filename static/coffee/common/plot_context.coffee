base = require("../base")
PNGView = require("./plot").PNGView
PlotView = require("./plot").PlotView
HasParent = base.HasParent
HasProperties = base.HasProperties
safebind = base.safebind
build_views = base.build_views

ContinuumView = require('./continuum_view').ContinuumView


class PlotContextView extends ContinuumView
  initialize: (options) ->
    @views = {}
    @views_rendered = [false]
    @child_models = []
    super(options)
    @render()

  delegateEvents: () ->
    safebind(this, @model, 'destroy', @remove)
    safebind(this, @model, 'change', @render)
    super()

  build_children: () ->
    created_views = build_views(
      @views, @mget_obj('children'), {})

    window.pc_created_views = created_views
    window.pc_views = @views
    return null

  events:
    #'click .jsp': 'newtab'
    'click .plotclose': 'removeplot'
    'click .closeall': 'closeall'

  size_textarea: (textarea) ->
    scrollHeight = $(textarea).height(0).prop('scrollHeight')
    $(textarea).height(scrollHeight)

  closeall: (e) =>
    @mset('children', [])
    @model.save()

  removeplot: (e) =>
    plotnum = parseInt($(e.currentTarget).parent().attr('data-plot_num'))
    s_pc = @model.resolve_ref(@mget('children')[plotnum])
    view = @views[s_pc.get('id')]
    view.remove();
    newchildren = (x for x in @mget('children') when x.id != view.model.id)
    @mset('children', newchildren)
    @model.save()
    return false

  render: () ->
    super()
    @build_children()
    for own key, val of @views
      val.$el.detach()
    @$el.html('')
    numplots = _.keys(@views).length
    @$el.append("<div>You have #{numplots} plots</div>")
    @$el.append("<div><a class='closeall' href='#'>Close All Plots</a></div>")
    @$el.append("<br/>")
    to_render = []
    tab_names = {}
    for modelref, index in @mget('children')
      view = @views[modelref.id]
      node = $("<div class='jsp' data-plot_num='#{index}'></div>"  )
      @$el.append(node)
      node.append($("<a class='plotclose'>[close]</a>"))
      node.append(view.el)
    _.defer(() =>
      for textarea in @$el.find('.plottitle')
        @size_textarea($(textarea))
    )
    return null

class PNGContextView extends PlotContextView
  initialize: (options) ->
    @thumb_x = options.thumb_x
    @thumb_y = options.thumb_y
    @views = {}
    @views_rendered = [false]
    @child_models = []
    super(options)
    @render()

  pngclick : (e) =>
    modeltype = $(e.currentTarget).attr('modeltype')
    modelid = $(e.currentTarget).attr('modelid')
    @trigger('showplot', {type : modeltype, id : modelid})

  delegateEvents: () ->
    safebind(this, @model, 'destroy', @remove)
    safebind(this, @model, 'change', @render)
    super()

  build_children: () ->
    view_classes = []
    for view_model in @mget_obj('children')
      if not view_model.get('png')
        console.log("no png for #{view_model.id} making one")
        pv = new view_model.default_view({model:view_model})
        pv.save_png()
      view_classes.push(PNGView)
    created_views = build_views(
      @views,
      @mget_obj('children'),
      {thumb_x:@thumb_x, thumb_y:@thumby},
      view_classes
    )

    window.pc_created_views = created_views
    window.pc_views = @views
    return null

  events:
    'click .plotclose': 'removeplot'
    'click .closeall': 'closeall'
    'click .pngview' : 'pngclick'



#PlotContextView = PNGContextView
class PlotContextViewState extends HasProperties
  defaults:
    maxheight: 600
    maxwidth: 600
    selected: 0

class PlotContextViewWithMaximized extends PlotContextView
  initialize: (options) ->
    @selected = 0
    @viewstate = new PlotContextViewState(
      maxheight: options.maxheight
      maxwidth: options.maxwidth
    )
    super(options)
    safebind(this, @viewstate, 'change', @render)
    safebind(this, @model, 'change:children', () =>
      selected = @viewstate.get('selected')
      if selected > @model.get('children') - 1
        @viewstate.set('selected', 0)
    )

  events:
    'click .maximize': 'maximize'
    'click .plotclose': 'removeplot'
    'click .closeall': 'closeall'
    'keydown .plottitle': 'savetitle'

  maximize: (e) ->
    plotnum = parseInt($(e.currentTarget).parent().attr('data-plot_num'))
    @viewstate.set('selected', plotnum)

  render: () ->
    super()
    @build_children()
    for own key, val of @views
      val.$el.detach()
    @$el.html('')
    main = $("<div class='plotsidebar'><div>")
    @$el.append(main)
    @$el.append("<div class='maxplot'>")
    main.append("<div><a class='closeall' href='#'>Close All Plots</a></div>")
    main.append("<br/>")
    to_render = []
    tab_names = {}
    for modelref, index in @mget('children')
      view = @views[modelref.id]
      node = $("<div class='jsp' data-plot_num='#{index}'></div>"  )
      main.append(node)
      title = view.model.get('title')
      node.append($("<textarea class='plottitle'>#{title}</textarea>"))
      node.append($("<a class='maximize'>[max]</a>"))
      node.append($("<a class='plotclose'>[close]</a>"))
      node.append(view.el)
    if @mget('children').length > 0
      modelref = @mget('children')[@viewstate.get('selected')]
      model = @model.resolve_ref(modelref)
      @maxview = new model.default_view(
        model: model
      )
      @$el.find('.maxplot').append(@maxview.$el)
    else
      @maxview = null

    _.defer(() =>
      for textarea in main.find('.plottitle')
        @size_textarea($(textarea))
      if @maxview
        width = model.get('width')
        height = model.get('height')
        maxwidth = @viewstate.get('maxwidth')
        maxheight = @viewstate.get('maxheight')
        widthratio = maxwidth/width
        heightratio = maxheight/height
        ratio = _.min([widthratio, heightratio])
        newwidth = ratio * width
        newheight = ratio * height
        @maxview.viewstate.set('height', newheight)
        @maxview.viewstate.set('width', newwidth)

    )
    return null


class PlotContext extends HasParent
  type: 'PlotContext',
  default_view: PlotContextView

  url: () ->
    return super()

  defaults:
    children: []
    render_loop: true

class PlotList extends PlotContext
  type: 'PlotList'

class PlotContexts extends Backbone.Collection
  model: PlotContext

class PlotLists extends PlotContexts
  model: PlotList

exports.PlotContext = PlotContext
exports.PlotContexts = PlotContexts
exports.PlotContextView = PlotContextView
exports.PlotContextViewState = PlotContextViewState
exports.PlotContextViewWithMaximized = PlotContextViewWithMaximized
exports.plotlists = new PlotLists()
exports.plotcontexts = new PlotContexts()
exports.PNGContextView = PNGContextView