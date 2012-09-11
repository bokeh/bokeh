
MAX_SIZE = 500
test('test_datatable', ()->
  expect(0)
  data = ({'x' : pt, 'y' : pt} for pt in _.range(MAX_SIZE))
  data_source1 = Bokeh.Collections['ObjectArrayDataSource'].create(
      data : data
    , {'local' : true}
  )
  plot1 = Bokeh.data_table(null, data_source1, 'x', 'y', 'x', 'circle')
  plot1.set('offset', [100, 100])
  scatterrenderer = plot1.resolve_ref(plot1.get('renderers')[0])



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
