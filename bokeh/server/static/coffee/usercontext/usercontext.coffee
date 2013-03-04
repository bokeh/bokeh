base = require("../base")
ContinuumView = base.ContinuumView
HasParent = base.HasParent
load_models = base.load_models
template = require("./wrappertemplate")
utility = require("../serverutils").utility
build_views = base.build_views

class PlotContextWrapper extends ContinuumView

  events :
    "click .bokehdoclabel" : "loaddoc"

  loaddoc : () ->
    @model.load()

  initialize : (options) ->
    super(options)
    @render_init()

  delegateEvents : (events) ->
    super(events)
    @listenTo(@model, 'loaded', @render)

  render_init : () ->
    html = template(model : @model, bodyid : _.uniqueId())
    @$el.html(html)
    @$el.addClass('accordion-group')

  render : () ->
    plot_context = @model.get_obj('plot_context')
    @plot_context_view = new plot_context.default_view(
      model : plot_context
    )
    @$el.find('.accordion-inner').append(@plot_context_view.el)
    return true

class UserDocsView extends ContinuumView
  initialize : (options) ->
    @collection = options.collection
    @views = {}
    super(options)
    @render()

  render : ->
    @$el.addClass('accordion')
    _.map(_.values(@views), (view) -> view.detach())
    build_views(@views, @collection.models, {})
    @$el.html('')
    for model in @collection.models
      @$el.append(@views[model.id].el)
    return @

class UserDoc extends HasParent
  default_view : PlotContextWrapper
  idAttribute : 'docid'
  defaults :
    docid : null
    title : null
    plot_context : null
    apikey : null

  load : () ->
    if @loaded
      return
    docid = @get('docid')
    resp = utility.load_doc(docid)
    resp.done((data) =>
      @set('apikey', data['apikey'])
      @set('plot_context', data['plot_context_ref'])
      @trigger('loaded')
      @loaded = true
      #do the websocket stuff later
    )

class UserDocs extends Backbone.Collection
  model : UserDoc

exports.UserDocs = UserDocs
exports.UserDocsView = UserDocsView