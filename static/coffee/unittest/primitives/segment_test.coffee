base = require("../../base")
Collections = base.Collections


test('segment_glyph', () ->
  expect(0)
  data_source = Collections('ObjectArrayDataSource').create(
    data : [
      {x0 : 1, y0 : 5, x1 : 2, y1 : 5.5},
      {x0 : 2, y0 : 4, x1 : 3, y1 : 4.5},
      {x0 : 3, y0 : 3, x1 : 4, y1 : 3.5},
      {x0 : 4, y0 : 2, x1 : 5, y1 : 2.5},
      {x0 : 5, y0 : 1, x1 : 6, y1 : 1.5},
    ]
  )
  plot_model = Collections('Plot').create()

  xdr = Collections('Range1d').create()
  xdr.set('start', 0)
  xdr.set('end', 10)

  ydr = Collections('Range1d').create()
  ydr.set('start', 0)
  ydr.set('end', 10)

  glyph_renderer = Collections('GlyphRenderer').create(
    data_source : data_source.ref()
    xdata_range : xdr.ref()
    ydata_range : ydr.ref()
    x0 : 'x0'
    y0 : 'y0'
    x1 : 'x1'
    y1 : 'y1'
    glyphs : [
        type : 'segment'
      ,
    ]
  )
  xaxis = Collections('LinearAxis').create(
    orientation : 'bottom'
    parent : plot_model.ref()
    data_range : xdr.ref()
  )
  yaxis = Collections('LinearAxis').create(
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
    view = new plot_model.default_view(model : plot_model)
    div.append(view.$el)
    view.render()
  console.log('Test segment_glyph')
  _.defer(myrender)
)

