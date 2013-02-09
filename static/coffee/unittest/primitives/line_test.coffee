base = require("../../base")
Collections = base.Collections


test('line_glyph', () ->
  expect(0)
  data_source = Collections('ObjectArrayDataSource').create(
    data : [
      {xs : [2,3,4,5,6,7,8], ys : [1,2,3,4,3,2,1]},
      {xs : [2,3,4,5,6,7,8], ys : [9,8,7,6,5,4,3], line_color : 'orange'},
      {xs : [2,3,4,5,6,7,8], ys : [3,4,5,6,7,8,9], line_color : 'blue', line_dash : [3,2]},
      {xs : [2,3,4,5,6,7,8], ys : [7,7,7,7,7,7,7], line_width : 6, line_color : 'green', line_alpha : 0.4},
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
    xs : 'xs'
    ys : 'ys'
    glyphs : [
        type : 'line'
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
  console.log('Test line_glyph')
  _.defer(myrender)
)

