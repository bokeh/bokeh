
define [
  "underscore",
  "backbone",
  "./build_views",
  "./safebind",
  "./has_parent"
  "./continuum_view",
], (_, Backbone, build_views, safebind, HasParent, ContinuumView) ->

  class PlotContextView extends ContinuumView.View
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
      created_views = build_views(@views, @mget_obj('children'), {})
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

  class PlotContext extends HasParent
    type: 'PlotContext',
    default_view: PlotContextView

    url: () ->
      return super()

    defaults: () ->
      return {
        children: []
        render_loop: true
      } 

  class PlotContexts extends Backbone.Collection
    model: PlotContext

  return {
    "Model": PlotContext,
    "Collection": new PlotContexts(),
    "View": PlotContextView,
  }
