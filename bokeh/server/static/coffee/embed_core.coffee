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
  addDirectPlot(
    settings.bokeh_docid, settings.bokeh_ws_conn_string, 
    settings.bokeh_docapikey, settings.bokeh_root_url,  
    settings.bokeh_modelid, settings.bokeh_modeltype, settings.element);

serverLoad = (docid, ws_conn_string, docapikey, root_url) ->
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



window.addPlotWrap = addPlotWrap;
window.addDirectPlotWrap = addDirectPlotWrap;
window.Bokeh.loadFinished=true;

console.log('embed_core');