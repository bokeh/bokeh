base = require("./base");
utility = require("./serverutils").utility;

addPlotWrap = (settings) ->
  addPlot(settings.bokeh_modelid, settings.bokeh_modeltype, settings.element);

addPlot = (modelid, modeltype, element) ->
  console.log("addPlot");
  console.log(modelid, modeltype, element);
  base.load_models(window.Bokeh.models);
  model = base.Collections(modeltype).get(modelid);
  view = new model.default_view({model : model})
  view.render()
  _.delay(-> $(element).append(view.$el))

addDirectPlotWrap = (settings) ->
  console.log("addDirectPlotWrap")
  addDirectPlot(
    settings.bokeh_docid, settings.bokeh_ws_conn_string, 
    settings.bokeh_docapikey, settings.bokeh_root_url,  
    settings.bokeh_modelid, settings.bokeh_modeltype, settings.element);

serverLoad = (docid, ws_conn_string, docapikey, root_url) ->
  console.log("serverLoad")
  headers = {'BOKEH-API-KEY' : docapikey };
  $.ajaxSetup({'headers' : headers});
  BokehConfig = base.Config;
  BokehConfig.prefix = root_url;
  BokehConfig.ws_conn_string = ws_conn_string;
  return utility.load_doc_once(docid);

addDirectPlot = (docid, ws_conn_string, docapikey, 
  root_url, modelid, modeltype, element) ->
  serverLoad(docid, ws_conn_string, docapikey, root_url).done(
    ->
      console.log("addPlot");
      console.log(modelid, modeltype, element);
      plot_collection = base.Collections(modeltype);
      model = plot_collection.get(modelid);
      view = new model.default_view({model : model});
      view.render()
      _.delay(-> $(element).append(view.$el)))


injectCss = (host) ->
  static_base = "http://#{host}/bokeh/static/vendor/bokehjs/"
  css_urls = ["#{static_base}css/bokeh.css",
             "#{static_base}css/continuum.css",
            "#{static_base}css/bootstrap.css"]
  load_css = (url) ->
    link = document.createElement('link');
    link.href = url; link.rel="stylesheet";
    link.type = "text/css";
    document.body.appendChild(link);
  _.map(load_css,css_urls);


foundEls = []
parse_el = (el) ->
  """this takes a bokeh embed script element and returns the relvant
  attributes through to a dictionary, """
  attrs = el.attributes;
  bokehRe = /bokeh.*/
  info = {};
  bokehCount = 0;
  window.attrs = attrs;
  for attr in attrs
    if attr.name.match(bokehRe)
      info[attr.name] = attr.value
      bokehCount++
    
  if bokehCount > 0
    return info;
  else 
    return false;

find_injections = ->
  els = document.getElementsByTagName('script');
  re = /.*embed.js.*/;
  new_settings = []
  for el in els
    is_new_el = el not in foundEls
    matches = el.src.match(re)
    if is_new_el and matches
      foundEls.push(el)
      info = parse_el(el)
      d = document.createElement('div');
      container = document.createElement('div');
      el.parentNode.insertBefore(container, el);
      info['element'] = container;
      new_settings.push(info)

  new_settings

plot_from_dict = (info_dict) ->
  if info_dict.bokeh_plottype == 'embeddata'
    window.addPlotWrap(info_dict)
  else
    window.addDirectPlotWrap(info_dict)

search_and_plot = ->
  new_plot_dicts = find_injections()
  console.log("find injections called");
  _.map(new_plot_dicts, plot_from_dict)




window.addPlotWrap = addPlotWrap;
window.addDirectPlotWrap = addDirectPlotWrap;

exports.search_and_plot = search_and_plot
console.log('embed_core');