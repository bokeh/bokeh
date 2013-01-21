if not window.$BokehServer
  window.$BokehServer = {}
$BokehServer = window.$BokehServer
if not $BokehServer.Models
  $BokehServer.Models = {}
if not $BokehServer.Collections
  $BokehServer.Collections = {}
if not $BokehServer.Views
  $BokehServer.Views = {}

$BokehServer = window.$BokehServer
$BokehServer.Deferreds = {}
$BokehServer.Promises = {}
$BokehServer.Deferreds._doc_loaded = $.Deferred()
$BokehServer.Deferreds._doc_requested = $.Deferred()
$BokehServer.Promises.doc_loaded = $BokehServer.Deferreds._doc_loaded.promise()

$BokehServer.utility =
  load_default_document : () ->
    user = $.get('/bokeh/userinfo/', {}, (data) ->
      console.log(data)
      docs = JSON.parse(data)['docs']
      console.log(docs)
      $BokehServer.utility.instantiate_doc(docs[0])
    )
  instantiate_doc : (docid) ->
    $.get("/bokeh/bokehinfo/#{docid}", {}, (data) ->
      data = JSON.parse(data)
      $BokehServer.plot_context_ref = data['plot_context_ref']
      $BokehServer.docid = data['docid'] # in case the server returns a different docid
      Continuum.docid = $BokehServer.docid
      #hack FIXME
      docid = $BokehServer.docid
      $('.resetlink').click(()->
        $.get("/bokeh/bb/#{docid}/reset")
      )
      $BokehServer.all_models = data['all_models']
      Continuum.load_models($BokehServer.all_models)
      Continuum.HasProperties.prototype.sync = Backbone.sync
      $BokehServer.apikey = data['apikey']
      $BokehServer.wswrapper = new Continuum.WebSocketWrapper($BokehServer.ws_conn_string)
      Continuum.submodels($BokehServer.wswrapper, "bokehplot:#{docid}", $BokehServer.apikey)
      $BokehServer.utility.render_plots()
      $BokehServer.Deferreds._doc_loaded.resolve($BokehServer.docid)

    )
  render_plots : () ->
    plotcontext = Continuum.resolve_ref(
      $BokehServer.plot_context_ref['collections'],
      $BokehServer.plot_context_ref['type'],
      $BokehServer.plot_context_ref['id']
    )
    plotcontextview = new plotcontext.default_view(
      model : plotcontext,
      render_loop: true
    )
    $BokehServer.plotcontext = plotcontext
    $BokehServer.plotcontextview = plotcontextview
    $BokehServer.plotcontextview.render()

  bokeh_connection : (host, docid, protocol) ->
    if _.isUndefined(protocol)
      protocol="https"
    if not $BokehServer.Deferreds._doc_requested.isResolved()
      $BokehServer.Deferreds._doc_requested.resolve()
      $.get("#{protocol}://#{host}/bokeh/publicbokehinfo/#{docid}", {}, (data) ->
        console.log('instatiate_doc_single, docid', docid)
        data = JSON.parse(data)
        $BokehServer.plot_context_ref = data['plot_context_ref']
        $BokehServer.docid = data['docid'] # in case the server returns a different docid
        Continuum.docid = $BokehServer.docid
        $BokehServer.all_models = data['all_models']
        Continuum.load_models($BokehServer.all_models)
        $BokehServer.Deferreds._doc_loaded.resolve($BokehServer.docid))

  instantiate_doc_single_plot : (docid, view_model_id, target_el="#PlotPane", host="www.wakari.io") ->
    $BokehServer.utility.bokeh_connection(host, docid)
    $BokehServer.Deferreds._doc_loaded.done(->
      $BokehServer.utility.render_single_plot(view_model_id, target_el)
    )

  render_single_plot : (view_model_id, el) ->
    plotcontext = Continuum.resolve_ref(
      $BokehServer.plot_context_ref['collections'],
      $BokehServer.plot_context_ref['type'],
      $BokehServer.plot_context_ref['id']
    )
    plotcontextview = new Bokeh.SinglePlotContextView(
      model : plotcontext,
      target_model_id:view_model_id
    )
    $BokehServer.plotcontext = plotcontext
    $BokehServer.plotcontextview = plotcontextview
    $BokehServer.plotcontextview.render()
    $(el).empty().append($BokehServer.plotcontextview.el)
