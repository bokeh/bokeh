define [
    "jquery",
    "common/base",
    "common/load_models",
    "server/serverrun",
  ],  ($, base, load_models, serverutils) ->

  inject_css = (url) ->
      link = $("<link href='#{url}' rel='stylesheet' type='text/css'/>>")
      $('body').append(link)

  add_plot = (element, data, all_models) ->
    modelid = data['bokehModelid'];
    load_models(all_models);
    modeltype = data['bokehModeltype'];
    model = base.Collections(modeltype).get(modelid)
    view = new model.default_view({model : model})
    _.delay(-> $(element).replaceWith(view.$el))

  add_plot_server = (element, data) ->
    resp = serverrun.load_one_object_chain(data["bokehDocid"], data["bokehModelid"])
    resp.done((data) ->
      model = base.Collections(data["bokehModeltype"]).get(data["bokehModelid"])
      view = new model.default_view(model : model)
      _.delay(-> $(element).replaceWith(view.$el))
    )
  inject_plot = (element_id, all_models) ->
    script = $("#" + element_id)
    info = script.data()
    Config.ws_conn_string = info['ConnString']
    container = $('<div>', {class: 'bokeh-container'})
    script.parentNode.insertBefore(container, script);
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