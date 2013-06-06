base = require("../base")
ContinuumView = require("../common/continuum_view").ContinuumView
HasParent = base.HasParent
HasProperties = base.HasProperties
load_models = base.load_models
template = require("./wrappertemplate")
userdocstemplate = require("./userdocstemplate")
documentationtemplate = require("./documentationtemplate")
utility = require("../serverutils").utility
build_views = base.build_views

class PlotContextWrapper extends ContinuumView
  events :
    "click .bokehdoclabel" : "loaddoc"
    "click .bokehdelete" : "deldoc"

  deldoc : (e) ->
    console.log('foo')
    e.preventDefault()
    @model.destroy()
    return false

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
    @docs = options.docs
    @collection = options.collection
    @views = {}
    super(options)
    @render()
  attributes :
    class : 'usercontext'
  events :
    'click .bokehrefresh' : () -> @collection.fetch({update:true})
  delegateEvents : (events) ->
    super(events)
    @listenTo(@collection, 'add', @render)
    @listenTo(@collection, 'remove', @render)
    @listenTo(@collection, 'add', (model, collection, options) =>
      @listenTo(model, 'loaded', () =>
        @listenTo(model.get_obj('plot_context'), 'change', () =>
          @trigger('show')
        )
      )
    )
    @listenTo(@collection, 'remove', (model, collection, options) =>
      @stopListening(model)
    )
  render_docs : ->
    @$el.html(documentationtemplate())
    @$el.append(@docs)

  render : ->
    if @collection.models.length == 0 and @docs
      return @render_docs()
    html = userdocstemplate()
    _.map(_.values(@views), (view) -> view.$el.detach())
    models = @collection.models.slice().reverse() # we want backwards
    build_views(@views, models, {})
    @$el.html(html)
    for model in models
      @$el.find(".accordion").append(@views[model.id].el)
    return @

class UserDoc extends HasParent
  default_view : PlotContextWrapper
  idAttribute : 'docid'
  defaults :
    docid : null
    title : null
    plot_context : null
    apikey : null

  sync : () ->

  destroy : (options) ->
    super(options)
    $.ajax(
      url: "/bokeh/doc/#{@get('docid')}/",
      type : 'delete'
    )

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
  subscribe : (wswrapper, username) ->
    wswrapper.subscribe("bokehuser:#{username}", null)
    @listenTo(wswrapper, "msg:bokehuser:#{username}", (msg) ->
      msg = JSON.parse(msg)
      if msg['msgtype'] == 'docchange'
        @fetch(update : true)
    )

  fetch : (options) ->
    if _.isUndefined(options )
      options = {}
    resp = response = $.get('/bokeh/userinfo/', {})
    resp.done((data) =>
      docs = data['docs']
      if options.update
        @update(docs, options)
      else
        @reset(docs, options)
    )
    return resp

exports.UserDocs = UserDocs
exports.UserDocsView = UserDocsView