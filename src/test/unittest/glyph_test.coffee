test('simple_glyph', () ->
  expect(0)
  data_source = Bokeh.Collections.ObjectArrayDataSource.create(
    data : [
      {x : 1, y : 5, z:3},
      {x : 2, y : 4, z:3},
      {x : 3, y : 3, z:3},
      {x : 4, y : 2, z:3},
      {x : 5, y : 1, z:3},
    ]
  )
  plot_model = Bokeh.Collections.Plot.create()
  xdr = Bokeh.Collections.DataRange1d.create(
    sources : [{ref : data_source.ref(), columns : ['x']}]
  )
  ydr = Bokeh.Collections.DataRange1d.create(
    sources : [{ref : data_source.ref(), columns : ['y']}]
  )
  glyph_renderer = Bokeh.Collections.GlyphRenderer.create(
    data_source : data_source.ref()
    xdata_range : xdr.ref()
    ydata_range : ydr.ref()
    scatter_size : 10
    color : 'black'
    x : 'x'
    y : 'y'
    glyphs : [
        type : 'circle'
        index : 0
      ,
        type : 'square'
        index : 1
      ,
        type : 'square'
        index : 2
        color : 'red'
      ,
        type : 'square'
        index : 2
        color : 'green'
        x : ['x', 0, 0.1]
      ,
        type : 'square'
        index : 2
        color : 'green'
        x : ['x', 0, -0.1]
    ]
  )
  xaxis = Bokeh.Collections['LinearAxis'].create(
    orientation : 'bottom'
    parent : plot_model.ref()
    data_range : xdr.ref()
  )
  yaxis = Bokeh.Collections['LinearAxis'].create(
    orientation : 'left',
    parent : plot_model.ref()
    data_range : ydr.ref()
  )
  plot_model.set(
    renderers : [glyph_renderer.ref()],
    axes : [xaxis.ref(), yaxis.ref()]
  )
  div = $('<div></div>')
  $('body').append(div)
  myrender  =  ->
    view = new Bokeh.PlotView(model : plot_model)
    div.append(view.$el)
    view.render()
  console.log('test_glyph')
  _.defer(myrender)
)