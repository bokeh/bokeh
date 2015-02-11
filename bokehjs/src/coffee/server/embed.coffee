define [
    "jquery",
    "underscore",
    "./serverutils",
    "./usercontext/usercontext",
    "common/base",
    "common/has_properties",
    "common/load_models",
    "common/logging",
],  ($, _, serverutils, usercontext, base, HasProperties, load_models, Logging) ->

  index = base.index
  logger = Logging.logger

  reload = () ->
    Config = require("common/base").Config
    ping_url = "#{Config.prefix}bokeh/ping"
    $.get(ping_url).success(() ->
      logger.info('reloading')
      window.location.reload()
    ).fail(_.delay((() -> reload()), 1000))
    return null

  inject_css = (url) ->
    link = $("<link href='#{url}' rel='stylesheet' type='text/css'>")
    $('body').append(link)

  add_plot_static = (element, model_id, model_type, all_models) ->
    load_models(all_models);
    model = base.Collections(model_type).get(model_id)
    view = new model.default_view({model : model})
    if model_id not of index
      index[model_id] = view
    _.delay(-> $(element).replaceWith(view.$el))

  copy_on_write_mapping = {}

  add_plot_server = (element, doc_id, model_id, is_public) ->
    resp = serverutils.utility.load_one_object_chain(doc_id, model_id, is_public)
    resp.done((data) ->
      model = base.Collections(data.type).get(model_id)
      view = new model.default_view(model : model)
      _.delay(-> $(element).replaceWith(view.$el))
      if model_id not of index
        index[model_id] = view
      wswrapper = serverutils.wswrapper
      wswrapper.subscribe("debug:debug", "")
      wswrapper.on('msg:debug:debug', (msg) ->
        if msg == 'reload'
          reload()
      )
    )

  inject_plot = (element_id, all_models) ->
    script = $("#" + element_id)
    if script.length == 0
      throw "Error injecting plot: could not find script tag with id: " + element_id
    if script.length > 1
      throw "Error injecting plot: found too many script tags with id: " + element_id
    if not document.body.contains(script[0])
      throw "Error injecting plot: autoload script tag may only be under <body>"
    info = script.data()
    Bokeh.set_log_level(info['bokehLoglevel'])
    logger.info("Injecting plot for script tag with id: #" + element_id)
    base.Config.prefix = info['bokehRootUrl']
    container = $('<div>', {class: 'bokeh-container'})
    container.insertBefore(script)
    if info.bokehData == "static"
      logger.info("  - using static data")
      add_plot_static(container, info["bokehModelid"], info["bokehModeltype"], all_models)
    else if info.bokehData == "server"
      logger.info("  - using server data")
      add_plot_server(container, info["bokehDocid"], info["bokehModelid"], info["bokehPublic"])
    else
      throw "Unknown bokehData value for inject_plot: " + info.bokehData

  server_page = (title) ->
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
        logger.info('subscribing to debug')
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
      _render(msg)
      logger.error(msg)

  _render = (html) -> $('#PlotPane').append(html)

  return {
    "inject_css": inject_css
    "inject_plot": inject_plot
    "add_plot_server": add_plot_server
    "add_plot_static": add_plot_static
    "server_page": server_page
  }
