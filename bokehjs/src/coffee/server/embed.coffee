define [
    "jquery",
    "common/base",
    "common/load_models",
    "server/serverutils",
],  ($, base, load_models, serverutils) ->
  inject_css = (url) ->
      link = $("<link href='#{url}' rel='stylesheet' type='text/css'>")
      $('body').append(link)

  add_plot = (element, info, all_models) ->
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
    info = script.data()
    base.Config.ws_conn_string = info['bokehConnString']
    base.Config.prefix = info['bokehRootUrl']
    container = $('<div>', {class: 'bokeh-container'})
    container.insertBefore(script)
    if info.bokehData == "static"
      add_plot(container, info, all_models)
    else if info.bokehData == "server"
      add_plot_server(container, info)
  exports = {
    inject_plot : inject_plot,
    add_plot_server : add_plot_server,
    add_plot : add_plot,
    inject_css : inject_css
  }
  return exports