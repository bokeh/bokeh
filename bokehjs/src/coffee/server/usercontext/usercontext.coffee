define [
    "underscore",
    "jquery",
    "common/base",
    "../serverutils",
    "common/continuum_view",
    "common/collection",
    "./userdocstemplate",
    "./documentationtemplate",
    "./wrappertemplate",
    "common/has_parent",
    "common/build_views",
    "common/load_models",
], (_, $, base, serverutils, ContinuumView, Collection,
    userdocstemplate, documentationtemplate,
    wrappertemplate, HasParent, build_views, load_models) ->

  exports = {}
  utility = serverutils.utility

  class DocView extends ContinuumView
    template : wrappertemplate
    attributes :
      class : 'panel-group'
    events :
      "click .bokehdoclabel" : "loaddoc"
      "click .bokehdelete" : "deldoc"

    deldoc : (e) ->
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
      # XXX: this code is executed only by server so we can safely
      # assume that window.$ points to server's jquery. We have to
      # use this instead of 'bootstrap/collapse', because server's
      # styles aren't prefixed with bs-bk-, as bokehjs does for
      # widgets, etc.
      #jquery = window.$

      #html = jquery(@template({model: @model, bodyid: _.uniqueId()}))
      #html.find(".collapse")
      #    .collapse({toggle: false})
      #    .on("show.bs.collapse", () => @loaddoc())

      html = @template({model: @model, bodyid: _.uniqueId()})
      @$el.html(html)

    render : () ->
      plot_context = @model.get('plot_context')
      @plot_context_view = new plot_context.default_view(
        model : plot_context
      )
      @$el.find('.plots').append(@plot_context_view.el)
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
          @listenTo(model.get('plot_context'), 'change', () =>
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

  class Doc extends HasParent
    default_view : DocView
    idAttribute : 'docid'
    defaults: ->
      return _.extend {}, super(), {
        docid: null
        title: null
        plot_context: null
        apikey: null
      }

    sync : () ->

    destroy : (options) ->
      super(options)
      $.ajax(
        url: "/bokeh/doc/#{@get('docid')}/",
        type : 'delete'
      )

    load : (use_title) ->
      if @loaded
        return
      if use_title
        title = @get('title')
        resp = utility.load_doc_by_title(title)
      else
        docid = @get('docid')
        resp = utility.load_doc(docid)

      resp.done((data) =>
        @set('docid', data.docid)
        @set('apikey', data['apikey'])
        @set('plot_context', data['plot_context_ref'])
        @trigger('loaded')
        @loaded = true
        #do the websocket stuff later
      )

  class UserDocs extends Collection
    model : Doc
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
      url = base.Config.prefix + "bokeh/userinfo/"
      resp = response = $.get(url, {})
      resp.done((data) =>
        docs = data['docs']
        if options.update
          @set(docs, options)
        else
          @reset(docs, options)
      )
      return resp

  exports.UserDocs = UserDocs
  exports.UserDocsView = UserDocsView
  exports.Doc = Doc
  exports.DocView = DocView
  return exports
