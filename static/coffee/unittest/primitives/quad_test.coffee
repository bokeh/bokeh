base = require("../../base")
Collections = base.Collections


test('quad_glyph', () ->
  expect(0)
  data_source = Collections('ObjectArrayDataSource').create(
    data : [
      {left : 1, right : 2, bottom : 5, top : 6},
      {left : 2, right : 3, bottom : 4, top : 5},
      {left : 3, right : 4, bottom : 3, top : 4, fill: "red"},
      {left : 4, right : 5, bottom : 2, top : 3, fill_alpha : 0.3},
      {left : 5, right : 6, bottom : 1, top : 2},
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
    left : 'left'
    right : 'right'
    bottom : 'bottom'
    top : 'top'
    glyphs : [
        type : 'quad'
        fill: 'blue'
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
  console.log('Test quad_glyph')
  _.defer(myrender)
)

