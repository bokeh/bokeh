define [
  "common/base",
  "common/load_models",
  "server/serverutils"
],  (base, load_models, serverutils) ->

  utility = serverutils.utility

  addPlotWrap = (settings, dd) ->
    addPlot(settings.bokeh_modelid, settings.bokeh_modeltype,
      settings.element, dd);

  addPlot = (modelid, modeltype, element, data) ->
    data_plot_id = _.keys(data)[0]
    if not data_plot_id == modelid
      #we want to make sure we are inserting the right plot data in he
      #right place
      return


    console.log("addPlot");
    console.log(modelid, modeltype, element);

    load_models(data[data_plot_id])
    model = base.Collections(modeltype).get(modelid);
    view = new model.default_view({model : model})
    view.render()
    _.delay(-> $(element).replaceWith(view.$el))

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
        #view.render()
        _.delay(-> $(element).replaceWith(view.$el)))

  injectCss = (static_root_url) ->
    css_urls = ["#{static_root_url}css/bokeh.css",
                "#{static_root_url}css/continuum.css",
                "#{static_root_url}js/vendor/bootstrap/bootstrap-bokeh-2.0.4.css"]


    load_css = (url) ->
      link = document.createElement('link');
      link.href = url; link.rel="stylesheet";
      link.type = "text/css";
      document.body.appendChild(link);
    _.map(css_urls, load_css);


  foundEls = []
  parse_el = (el) ->
    """this takes a bokeh embed script element and returns the relvant
    attributes through to a dictionary, """
    attrs = el.attributes;
    bokehRe = /bokeh.*/
    info = {};
    bokehCount = 0;
    for attr in attrs
      if attr.name.match(bokehRe)
        info[attr.name] = attr.value
        bokehCount++

    if bokehCount > 0
      return info;
    else
      return false;

  unsatisfied_els = {}
  find_injections = ->
    #TODO:make this find files that aren't named embed.js
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
        container.className="bokeh-container"
        el.parentNode.insertBefore(container, el);
        info['element'] = container;
        new_settings.push(info)
    new_settings


  search_and_plot = (dd)->
    plot_from_dict = (info_dict, key) ->
      if info_dict.bokeh_plottype == 'embeddata'
        dd_id = _.keys(dd)[0]
        if key == dd_id
          addPlotWrap(info_dict, dd)
          delete unsatisfied_els[key]
      else
        addDirectPlotWrap(info_dict)
        delete unsatisfied_els[key]

    new_plot_dicts = find_injections()

    _.each(new_plot_dicts, (plotdict) ->
      unsatisfied_els[plotdict['bokeh_modelid']] = plotdict)

    _.map(unsatisfied_els, plot_from_dict)

  exports ={
    search_and_plot : search_and_plot,
    injectCss : injectCss
  }
  return exports
