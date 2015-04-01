$ = require "jquery"
_ = require "underscore"
build_views = require "./build_views"
HasParent = require "./has_parent"
ContinuumView = require "./continuum_view"

class PlotContextView extends ContinuumView
  initialize: (options) ->
    @views = {}
    @child_models = []
    super(options)
    @render()

  delegateEvents: () ->
    @listenTo(@model, 'destroy', @remove)
    @listenTo(@model, 'change', @render)
    super()

  build_children: () ->
    created_views = build_views(@views, @mget('children'), {})
    window.pc_created_views = created_views
    window.pc_views = @views
    return null

  size_textarea: (textarea) ->
    scrollHeight = $(textarea).height(0).prop('scrollHeight')
    $(textarea).height(scrollHeight)

  closeall: (e) =>
    @mset('children', [])
    @model.save()

  removeplot: (e) =>
    plotnum = parseInt($(e.currentTarget).parent().attr('data-plot_num'))
    s_pc = @mget('children')[plotnum]
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
    to_render = []
    tab_names = {}
    for modelref, index in @mget('children')
      view = @views[modelref.id]
      node = $("<div class='jsp' data-plot_num='#{index}'></div>")
      @$el.append(node)
      node.append(view.el)
    _.defer(() =>
      for textarea in @$el.find('.plottitle')
        @size_textarea($(textarea))
    )
    return null

class PlotContext extends HasParent
  type: 'PlotContext',
  default_view: PlotContextView

  url: () ->
    return super()

  defaults: ->
    return _.extend {}, super(), {
      children: []
    }

module.exports =
  Model: PlotContext
  View: PlotContextView
