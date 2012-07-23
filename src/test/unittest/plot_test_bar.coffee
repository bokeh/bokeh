test('test_vbar', ()->
  expect(0)
  div = $('<div style="border:1px solid black"></div>')
  $('body').append(div)
  data_source = Bokeh.Collections['ObjectArrayDataSource'].create({
    data : [{x : 1, y : 2, cfield : 'a'},
      {x : 2, y : 3, cfield : 'b'},
      {x : 3, y : 4, cfield : 'c'},
      {x : 4, y : 5, cfield : 'd'},
      {x : 5, y : 6, cfield : 'e'}]
  }, {'local' : true})
  plot1 = Bokeh.bar_plot(null, data_source, 'x', 'y', 'vertical')
  plot1.set('offset', [100, 100])
  barrenderer = plot1.resolve_ref(plot1.get('renderers')[0])
  pantool = Bokeh.Collections['PanTool'].create(
    {'xmappers' : [barrenderer.get('xmapper')],
    'ymappers' : [barrenderer.get('ymapper')]}
    , {'local':true})
  zoomtool = Bokeh.Collections['ZoomTool'].create(
    {'xmappers' : [barrenderer.get('xmapper')],
    'ymappers' : [barrenderer.get('ymapper')]}
    , {'local':true})
  plot1.set('tools', [pantool.ref(), zoomtool.ref()])

  window.plot1 = plot1
  window.myrender = () ->
    view = new plot1.default_view({'model' : plot1, 'render_loop' : true});
    div.append(view.$el)
    view.render()
    window.view = view
  _.defer(window.myrender)
)

test('test_hbar', ()->
  div = $('<div style="border:1px solid black"></div>')
  $('body').append(div)
  expect(0)
  data_source = Bokeh.Collections['ObjectArrayDataSource'].create({
    data : [{x : 1, y : 2, cfield : 'a'},
      {x : 2, y : 3, cfield : 'b'},
      {x : 3, y : 4, cfield : 'c'},
      {x : 4, y : 5, cfield : 'd'},
      {x : 5, y : 6, cfield : 'e'}]
  }, {'local' : true})
  plot1 = Bokeh.bar_plot(null, data_source, 'x', 'y', 'horizontal')
  plot1.set('offset', [100, 100])
  barrenderer = plot1.resolve_ref(plot1.get('renderers')[0])
  pantool = Bokeh.Collections['PanTool'].create(
    {'xmappers' : [barrenderer.get('xmapper')],
    'ymappers' : [barrenderer.get('ymapper')]}
    , {'local':true})
  zoomtool = Bokeh.Collections['ZoomTool'].create(
    {'xmappers' : [barrenderer.get('xmapper')],
    'ymappers' : [barrenderer.get('ymapper')]}
    , {'local':true})
  plot1.set('tools', [pantool.ref(), zoomtool.ref()])

  window.plot1 = plot1
  window.myrender = () ->
    view = new plot1.default_view({'model' : plot1, 'render_loop' : true});
    div.append(view.$el)
    view.render()
    window.view = view
  _.defer(window.myrender)
)

# test('test_ordinalbar', ()->
#   expect(0)
#   data_source = Bokeh.Collections['ObjectArrayDataSource'].create({
#     data : [{x : 1, y : 2, cfield : 'a'},
#       {x : 2, y : 3, cfield : 'b'},
#       {x : 3, y : 4, cfield : 'c'},
#       {x : 4, y : 5, cfield : 'd'},
#       {x : 5, y : 6, cfield : 'e'}]
#   }, {'local' : true})
#   container = Bokeh.Collections['InteractiveContext'].create(
#     {}, {'local' : true});
#   plot1 = Bokeh.bar_plot(container, data_source, 'cfield', 'y', 'vertical')
#   container.set({'children' : [plot1.ref()]})
#   plot1.set('offset', [100, 100])
#   barrenderer = plot1.resolve_ref(plot1.get('renderers')[0])
#   pantool = Bokeh.Collections['PanTool'].create(
#     {'xmappers' : [barrenderer.get('xmapper')],
#     'ymappers' : [barrenderer.get('ymapper')]}
#     , {'local':true})
#   zoomtool = Bokeh.Collections['ZoomTool'].create(
#     {'xmappers' : [barrenderer.get('xmapper')],
#     'ymappers' : [barrenderer.get('ymapper')]}
#     , {'local':true})
#   plot1.set('tools', [pantool.ref(), zoomtool.ref()])

#   window.plot1 = plot1
#   window.myrender = () ->
#     view = new container.default_view({'model' : container, 'render_loop' : true});
#     view.render()
#     # plot1.set({'width' : 300})
#     # plot1.set({'height' : 300})
#     window.view = view
#   _.defer(window.myrender)
# )
