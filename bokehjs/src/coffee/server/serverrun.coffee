define ["common/base",
  "./serverutils",
  "./usercontext/usercontext",
  "common/has_properties"
],  (base, serverutils, usercontext, HasProperties) ->
  Config = base.Config
  Promises = serverutils.Promises
  Config.ws_conn_string = "ws://#{window.location.host}/bokeh/sub"

  load = (title) ->
    HasProperties.prototype.sync = Backbone.sync
    $(() ->
      wswrapper = serverutils.utility.make_websocket()

      userdocs = new usercontext.UserDocs()
      userdocs.subscribe(wswrapper, 'defaultuser')

      window.userdocs = userdocs

      load = userdocs.fetch()
      load.done () ->
        if title?
          _render_one(userdocs, title)
        else
          _render_all(userdocs)
    )

  _render_all = (userdocs) ->
    userdocsview = new usercontext.UserDocsView(collection: userdocs)
    _render(userdocsview.el)

  _render_one = (userdocs, title) ->
    doc = userdocs.find((doc) -> doc.get('title') == title)

    if doc?
      doc.on('loaded', () ->
        plot_context = doc.get_obj('plot_context')
        plot_context_view = new plot_context.default_view(model: plot_context)
        _render(plot_context_view.el)
      )
      doc.load()
    else
      msg = "Document '#{title}' wasn't found on this server."
      _render(msg); console.error(msg)

  _render = (html) -> $('#PlotPane').append(html)

  return load: load
