define [
    "jquery",
    "common/base",
    "common/load_models",
    "server/serverutils",
],  ($, base, load_models, serverutils) ->

  inject_css = (url) ->
      link = $("<link href='#{url}' rel='stylesheet' type='text/css'>")
      $('body').append(link)

  add_plot_static = (element, info, all_models) ->
    modelid = info['bokehModelid'];
    load_models(all_models);
    modeltype = info['bokehModeltype'];
    model = base.Collections(modeltype).get(modelid)
    view = new model.default_view({model : model})
    _.delay(-> $(element).replaceWith(view.$el))

  add_plot_server = (element, info) ->
    resp = serverutils.utility.load_one_object_chain(info["bokehDocid"], info["bokehModelid"])
    resp.done((data) ->
      model = base.Collections(info["bokehModeltype"]).get(info["bokehModelid"])
      view = new model.default_view(model : model)
      _.delay(-> $(element).replaceWith(view.$el))
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
    Bokeh.set_log_level(info["bokehLogLevel"])
    Bokeh.logger.info("Injecting plot for script tag with id: #" + element_id)
    base.Config.ws_conn_string = info['bokehConnString']
    base.Config.prefix = info['bokehRootUrl']
    container = $('<div>', {class: 'bokeh-container'})
    container.insertBefore(script)
    if info.bokehData == "static"
      Bokeh.logger.info("  - using static data")
      add_plot_static(container, info, all_models)
    else if info.bokehData == "server"
      Bokeh.logger.info("  - using server data")
      add_plot_server(container, info)
    else
      throw "Unknown bokehData value for inject_plot: " + info.bokehData

  return {
    "inject_plot": inject_plot,
    "add_plot_server": add_plot_server,
    "add_plot_static": add_plot_static,
    "inject_css": inject_css
  }
