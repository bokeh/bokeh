test('test_interactive', ()->
  expect(0)
  data_source1 = Bokeh.Collections['ObjectArrayDataSource'].create({
    data : [{x : 1, y : -2},
      {x : 2, y : -3},
      {x : 3, y : -4},
      {x : 4, y : -5},
      {x : 5, y : -6}]
  }, {'local' : true})
  plot1 = Bokeh.scatter_plot(null, data_source1, 'x', 'y', 'x', 'circle')
  plot1.set('offset', [100, 100])
  scatterrenderer = plot1.resolve_ref(plot1.get('renderers')[0])
  pantool = Bokeh.Collections['PanTool'].create(
    {'xmappers' : [scatterrenderer.get('xmapper')],
    'ymappers' : [scatterrenderer.get('ymapper')]}
    , {'local':true})
  zoomtool = Bokeh.Collections['ZoomTool'].create(
    {'xmappers' : [scatterrenderer.get('xmapper')],
    'ymappers' : [scatterrenderer.get('ymapper')]}
    , {'local':true})
  selecttool = Bokeh.Collections['SelectionTool'].create(
    {'renderers' : [scatterrenderer.ref()]
    'data_source_options' : {'local' : true}}
    , {'local':true})
  selectoverlay = Bokeh.Collections['ScatterSelectionOverlay'].create(
    {'renderers' : [scatterrenderer.ref()]}
    , {'local':true})

  plot1.set('tools', [pantool.ref(), zoomtool.ref(), selecttool.ref()])
  plot1.set('overlays', [selectoverlay.ref()])

  window.plot1 = plot1
  div = $('<div style="border:1px solid black"></div>')
  $('body').append(div)
  window.myrender = () ->
    view = new plot1.default_view(
      model : plot1,
      render_loop : true,
    )
    div.append(view.$el)
    view.render()
    plot1.set({'width' : 300})
    plot1.set({'height' : 300})
    window.view = view
  _.defer(window.myrender)
)
