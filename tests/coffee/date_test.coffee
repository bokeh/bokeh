base = require("../base")
Collections = base.Collections
testutils = require("./testutils")
line_plot = testutils.line_plot
scatter_plot = testutils.scatter_plot


test('test_date_hour_intervals', ()->
  expect(0)
  base = Number(new Date())
  #interval is one hour
  interval = 3600 * 1000.0
  data_source1 = Collections('ObjectArrayDataSource').create(
    data : [{x : base, y : -2},
      {x : base + interval, y : -3},
      {x : base + interval * 2, y : -4},
      {x : base + interval * 3, y : -5},
      {x : base + interval * 4, y : -6}]
  )
  plot1 = scatter_plot(null, data_source1, 'x', 'y', 'x', 'circle')
  old_axis = plot1.resolve_ref(plot1.get('axes')[0])
  date_axis = Collections('LinearDateAxis').create(
      old_axis.attributes
  )
  plot1.get('axes')[0] = date_axis.ref()
  scatterrenderer = plot1.resolve_ref(plot1.get('renderers')[0])
  pantool = Collections('PanTool').create(
    {'xmappers' : [scatterrenderer.get('xmapper')],
    'ymappers' : [scatterrenderer.get('ymapper')]}
  )
  zoomtool = Collections('ZoomTool').create(
    {'xmappers' : [scatterrenderer.get('xmapper')],
    'ymappers' : [scatterrenderer.get('ymapper')]}
  )
  selecttool = Collections('SelectionTool').create(
    {'renderers' : [scatterrenderer.ref()]
    'data_source_options' : {'local' : true}}
  )
  plot1.set('tools', [pantool.ref(), zoomtool.ref(), selecttool.ref()])
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

test('test_date_day_intervals', ()->
  expect(0)
  base = Number(new Date())
  #interval is one hour
  interval = 3600 * 1000.0 * 24
  data_source1 = Collections('ObjectArrayDataSource').create({
    data : [{x : base, y : -2},
      {x : base + interval, y : -3},
      {x : base + interval * 2, y : -4},
      {x : base + interval * 3, y : -5},
      {x : base + interval * 4, y : -6}]
  })
  plot1 = scatter_plot(null, data_source1, 'x', 'y', 'x', 'circle')
  old_axis = plot1.resolve_ref(plot1.get('axes')[0])
  date_axis = Collections('LinearDateAxis').create(
      old_axis.attributes
  )
  plot1.get('axes')[0] = date_axis.ref()
  scatterrenderer = plot1.resolve_ref(plot1.get('renderers')[0])
  pantool = Collections('PanTool').create(
    {'xmappers' : [scatterrenderer.get('xmapper')],
    'ymappers' : [scatterrenderer.get('ymapper')]}
  )
  zoomtool = Collections('ZoomTool').create(
    {'xmappers' : [scatterrenderer.get('xmapper')],
    'ymappers' : [scatterrenderer.get('ymapper')]}
  )
  selecttool = Collections('SelectionTool').create(
    {'renderers' : [scatterrenderer.ref()]}
  )
  selectoverlay = Collections('BoxSelectionOverlay').create(
    {'tool' : selecttool.ref()}
  )

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
