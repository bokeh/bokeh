base = require("../base")
testutils = require("../testutils")
Collections = base.Collections

MAX_SIZE = 500
setup_interactive = () ->
  data = ({'x' : pt, 'y' : pt} for pt in _.range(MAX_SIZE))
  data_source1 = Collections('ObjectArrayDataSource').create(
      data : data
    , {'local' : true}
  )
  plot1 = testutils.scatter_plot(null, data_source1, 'x', 'y', 'x', 'circle')
  plot1.set('offset', [100, 100])
  scatterrenderer = plot1.resolve_ref(plot1.get('renderers')[0])
  pantool = Collections('PanTool').create(
     dataranges : [scatterrenderer.get('xdata_range'), scatterrenderer.get('ydata_range')],
     dimensions : ['width', 'height']
  )
  zoomtool = Collections('ZoomTool').create(
     dataranges : [scatterrenderer.get('xdata_range'), scatterrenderer.get('ydata_range')],
     dimensions : ['width', 'height']
  )
  selecttool = Collections('SelectionTool').create(
    {'renderers' : [scatterrenderer.ref()]}
  )
  boxoverlay = Collections('BoxSelectionOverlay').create(
    {'tool' : selecttool.ref()}
  )
  plot1.set('tools', [pantool.ref(), zoomtool.ref(), selecttool.ref()])
  plot1.set('overlays', [boxoverlay.ref()])
  window.plot1 = plot1
  return plot1

test('test_interactive', ()->
  expect(0)
  plot1 = setup_interactive()
  div = $('<div style="border:1px solid black"></div>')
  $('body').append(div)
  window.myrender = () ->
    view = new plot1.default_view(
      model : plot1,
      render_loop : true)
    div.append(view.$el)
    view.render()
    window.view = view
  _.defer(window.myrender)
)

test('test_pan_tool', ()->
  expect(0)

  """ when this test runs you should see only one line, not an
  artifact from an earlier line """
  plot1 = setup_interactive()
  div = $('<div style="border:1px solid black"></div>')
  $('body').append(div)
  window.myrender = () ->
    view = new plot1.default_view(
      model : plot1,
      render_loop : true,
    )
    div.append(view.$el)
    view.render()
    window.view = view
    window.pantool = plot1.resolve_ref(plot1.get('tools')[0])
    _.defer(() ->
       ptv = _.filter(view.tools, ((v) -> v.model == window.pantool))[0]
       ptv.dragging=true
       ptv._set_base_point({'bokehX' : 0, 'bokehY' : 0})
       ptv._drag({'bokehX' : 30, 'bokehY' : 30})
       window.ptv = ptv
    )
  _.defer(window.myrender)
)

test('test_two_views', () ->
  expect(0)
  plot1 = setup_interactive()
  div = $('<div style="border:1px solid black"></div>')
  $('body').append(div)
  window.myrender = () ->
    view = new plot1.default_view(
      model : plot1,
      render_loop : true,
    )
    view2 = new plot1.default_view(
      model : plot1,
      render_loop : true,
    )
    div.append(view.$el)
    div.append(view2.$el)
    view.render()
    view2.render()
    window.view = view
    window.view2 = view2
    view.viewstate.set('height', 300)
    view.viewstate.set('width', 300)
    view2.viewstate.set('height', 300)
    view2.viewstate.set('width', 400)
  _.defer(window.myrender)
)

# MAX_SIZE = 500
# test('test_tool_multisource', ()->
#   expect(0)
#   #HUGO - I can't figure out what this test does, commenting it out
#   """ when this test runs you should see only one line, not an
#   artifact from an earlier line """
#   data = ({'x' : pt, 'y' : pt} for pt in _.range(MAX_SIZE))
#   data_source1 = Collections('ObjectArrayDataSource').create(
#       data : data
#   )
#   data = ({'x2' : 2 * pt, 'y2' : pt} for pt in _.range(MAX_SIZE))
#   data_source2 = Collections('ObjectArrayDataSource').create(
#       data : data
#   )
#   plot1 = testutils.scatter_plot(null, data_source1, 'x', 'y', 'x', 'circle')
#   color_mapper = Collections('DiscreteColorMapper').create(
#     data_range : Collections('DataFactorRange').create(
#         data_source : data_source2.ref()
#         columns : ['x2']
#     )
#   )
#   scatterrenderer = plot1.resolve_ref(plot1.get('renderers')[0])
#   xmapper = scatterrenderer.get_obj('xmapper')
#   xdr = plot1.resolve_ref(xmapper.get('data_range'))
#   xdr.get('sources').push(
#     ref : data_source2.ref()
#     columns : ['x2']
#   )
#   ymapper = scatterrenderer.get_obj('ymapper')
#   ydr = plot1.resolve_ref(ymapper.get('data_range'))
#   ydr.get('sources').push(
#     ref : data_source2.ref()
#     columns : ['y2']
#   )


#   scatterrenderer2 = Collections("ScatterRenderer").create(
#     data_source : data_source2.ref()
#     xfield : 'x2'
#     yfield : 'y2'
#     color_field : 'x2'
#     color_mapper : color_mapper
#     mark : 'circle'
#     xmapper : xmapper.ref()
#     ymapper : ymapper.ref()
#     parent : plot1.ref()
#   )
#   plot1.get('renderers').push(scatterrenderer2)
#   pantool = Collections('PanTool').create(
#     {'xmappers' : [scatterrenderer.get('xmapper')],
#     'ymappers' : [scatterrenderer.get('ymapper')]}
#     , {'local':true})
#   zoomtool = Collections('ZoomTool').create(
#     {'xmappers' : [scatterrenderer.get('xmapper')],
#     'ymappers' : [scatterrenderer.get('ymapper')]}
#     , {'local':true})
#   selecttool = Collections('SelectionTool').create(
#     {'renderers' : [scatterrenderer.ref(), scatterrenderer2.ref()]
#     'data_source_options' : {'local' : true}}
#     , {'local':true})
#   selectoverlay = Collections('ScatterSelectionOverlay').create(
#     {'renderers' : [scatterrenderer.ref(), scatterrenderer2.ref()]}
#     , {'local':true})
#   plot1.set('tools', [pantool.ref(), zoomtool.ref(), selecttool.ref()])
#   plot1.set('overlays', [selectoverlay.ref()])
#   window.plot1 = plot1
#   div = $('<div style="border:1px solid black"></div>')
#   $('body').append(div)
#   window.myrender = () ->
#     view = new plot1.default_view(
#       model : plot1,
#       render_loop : true,
#     )
#     div.append(view.$el)
#     view.render()
#     window.view = view
#     window.pant = pantool
#   _.defer(window.myrender)
# )
