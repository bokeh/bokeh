
MAX_SIZE = 500
test('test_interactive', ()->
  expect(0)
  data = ({'x' : pt, 'y' : pt} for pt in _.range(MAX_SIZE))
  data_source1 = Bokeh.Collections['ObjectArrayDataSource'].create(
      data : data
    , {'local' : true}
  )
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

  data2 = ({'x' : pt, 'y' : pt} for pt in _.range(MAX_SIZE))
  data_source2 = Bokeh.Collections['ObjectArrayDataSource'].create(
      data : data
    , {'local' : true}
  )
  plot2 = Bokeh.scatter_plot(null, data_source2, 'x', 'y', 'x', 'circle')
  plot2.set('offset', [100, 100])
  scatterrenderer2 = plot1.resolve_ref(plot2.get('renderers')[0])
  pantool2 = Bokeh.Collections['PanTool'].create(
    {'xmappers' : [scatterrenderer2.get('xmapper')],
    'ymappers' : [scatterrenderer2.get('ymapper')]}
    , {'local':true})
  zoomtool2 = Bokeh.Collections['ZoomTool'].create(
    {'xmappers' : [scatterrenderer2.get('xmapper')],
    'ymappers' : [scatterrenderer2.get('ymapper')]}
    , {'local':true})
  selecttool2 = Bokeh.Collections['SelectionTool'].create(
    {'renderers' : [scatterrenderer2.ref()]
    'data_source_options' : {'local' : true}}
    , {'local':true})
  selectoverlay2 = Bokeh.Collections['ScatterSelectionOverlay'].create(
    {'renderers' : [scatterrenderer2.ref()]}
    , {'local':true})

  plot2.set('tools', [pantool2.ref(), zoomtool2.ref(), selecttool2.ref()])
  plot2.set('overlays', [selectoverlay2.ref()])

  window.plot2 = plot2
  div2 = $('<div style="border:1px solid black"></div>')
  $('body').append(div2)
  window.myrender = () ->
    view = new plot1.default_view(
      model : plot1,
      render_loop : true)
    view2 = new plot2.default_view(
      model : plot2,
      render_loop : true)
    div.append(view.$el)
    div2.append(view2.$el)
    view.render()
    view2.render()
    plot1.set({'width' : 300})
    plot1.set({'height' : 300})
    plot2.set({'width' : 300})
    plot2.set({'height' : 300})

    window.view = view
    window.view2 = view2
  _.defer(window.myrender)
)

test('test_pan_tool', ()->
  expect(0)

  """ when this test runs you should see only one line, not an
  artifact from an earlier line """

  data = ({'x' : pt, 'y' : pt} for pt in _.range(MAX_SIZE))
  data_source1 = Bokeh.Collections['ObjectArrayDataSource'].create(
      data : data
    , {'local' : true}
  )
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
    plot1.set({'width' : 800})
    plot1.set({'height' : 300})
    window.view = view
    window.pant = pantool
    _.defer(->
      ptv = _.filter(view.tools, (v) -> v.model == pantool)[0]
      ptv.dragging=true
      ptv._drag(0,20)
      window.ptv = ptv
      )
  _.defer(window.myrender)
)
