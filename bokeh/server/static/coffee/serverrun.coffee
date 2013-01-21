$BokehServer.ws_conn_string = "ws://#{window.location.host}/bokeh/sub"
$(()->
  $BokehServer.utility.load_default_document()
)
$.when($BokehServer.Promises.doc_loaded).then(()->
  $('#PlotPane').empty().append($BokehServer.plotcontextview.el)
)

$BokehServer.utility.render_plots = () ->
  plotcontext = Continuum.resolve_ref(
    $BokehServer.plot_context_ref['collections'],
    $BokehServer.plot_context_ref['type'],
    $BokehServer.plot_context_ref['id']
  )
  plotcontextview = new Bokeh.PlotContextViewWithMaximized(
    model : plotcontext,
    maxheight : $(window).height() - 100;
    maxwidth : $(window).width() - 400
  )

  $BokehServer.plotcontext = plotcontext
  $BokehServer.plotcontextview = plotcontextview
  $BokehServer.plotcontextview.render()
