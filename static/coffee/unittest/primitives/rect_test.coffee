base = require("../../base")
Collections = base.Collections


test('rect_glyph', () ->
  expect(0)
  data_source = Collections('ObjectArrayDataSource').create(
    data : [
      {x : 1, y : 5},
      {x : 2, y : 4},
      {x : 3, y : 3, fill: "red"},
      {x : 4, y : 2, fill_alpha: 0.3},
      {x : 5, y : 1},
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
    x : 'x'
    y : 'y'
    width:
      units: "screen"
      default: 8
    height:
      units: "screen"
      default: 12
    angle: 0
    glyphs : [
        type : 'rect'
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
  console.log('Test rect_glyph')
  _.defer(myrender)
)

