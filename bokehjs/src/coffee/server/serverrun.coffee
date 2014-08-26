define ["common/base",
  "./serverutils",
  "./usercontext/usercontext",
  "common/has_properties"
],  (base, serverutils, usercontext, HasProperties) ->
  Config = base.Config
  Promises = serverutils.Promises

  # auto detect prefix
  # window.bokeh_prefix, and window.bokeh_ws_conn_string can be set inside
  # templates from the server

  url = window.location.href
  if url.indexOf('/bokeh') > 0
    prefix = url.slice(0, url.indexOf('/bokeh')) + "/" #keep trailing slash
  else
    prefix = '/'
  serverutils.configure_server(null, prefix)

  reload = () ->
    Config = require("common/base").Config
    ping_url = "#{Config.prefix}bokeh/ping"
    $.get(ping_url)
      .success(() ->
        console.log('reloading')
        window.location.reload())
      .fail(_.delay((() -> reload()), 1000))
    return null

  load_one_object = (docid, objid) ->
    HasProperties.prototype.sync = Backbone.sync
    $(() ->
      resp = serverutils.utility.load_one_object_chain(docid, objid)
      resp.done((data) ->
        model = base.Collections(data.type).get(objid)
        view = new model.default_view(model : model)
        _render(view.el)
        wswrapper = serverutils.wswrapper
        wswrapper.subscribe("debug:debug", "")
        wswrapper.on('msg:debug:debug', (msg) ->
          if msg == 'reload'
            reload()
        )
      )
    )
  load = (title) ->
    HasProperties.prototype.sync = Backbone.sync
    $(() ->
      resp = serverutils.utility.make_websocket()
      resp.then(() ->
        wswrapper = serverutils.wswrapper
        userdocs = new usercontext.UserDocs()
        userdocs.subscribe(wswrapper, 'defaultuser')
        load = userdocs.fetch()
        load.done () ->
          if title?
            _render_one(userdocs, title)
          else
            _render_all(userdocs)
        console.log('subscribing to debug')
        wswrapper.subscribe("debug:debug", "")
        wswrapper.on('msg:debug:debug', (msg) ->
          if msg == 'reload'
            reload()
        )
      )
    )

  _render_all = (userdocs) ->
    userdocsview = new usercontext.UserDocsView(collection: userdocs)
    _render(userdocsview.el)

  _render_one = (userdocs, title) ->
    doc = userdocs.find((doc) -> doc.get('title') == title)

    if doc?
      doc.on('loaded', () ->
        plot_context = doc.get('plot_context')
        plot_context_view = new plot_context.default_view(model: plot_context)
        _render(plot_context_view.el)
      )
      doc.load()
    else
      msg = "Document '#{title}' wasn't found on this server."
      _render(msg); console.error(msg)

  _render = (html) -> $('#PlotPane').append(html)

  return {
    load: load
    load_one_object : load_one_object
  }
