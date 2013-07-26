Collections = require('../../base').Collections
make_glyph_plot = require('../testutils').make_glyph_plot

xrange = Collections('Range1d').create({start: 0, end: 10})
yrange = Collections('Range1d').create({start: 0, end: 10})

data_source = Collections('ObjectArrayDataSource').create(
  data: [
    {x: 1, y: 5},
    {x: 2, y: 4},
    {x: 3, y: 3},
    {x: 4, y: 2},
    {x: 5, y: 1},
  ]
)

defaults = {}

glyph = {
  type: 'circle'
  fill: 'blue'
  radius:
    field: 'radius'
    default: 5
  units: 'screen'
  x: 'x'
  y: 'y'
}

test('dataslider_test', () ->
  expect(0)
  plot_model = make_glyph_plot(data_source, defaults, glyph, xrange, yrange, {})
  slider1 = Collections("DataSlider").create(
    data_source : data_source.ref(),
    field : 'x'
  )
  slider2 = Collections("DataSlider").create(
    data_source : data_source,
    field : 'y'
  )
  plot_model.get('tools').push(slider1.ref())
  plot_model.get('tools').push(slider2.ref())
  div = $('<div></div>')
  $('body').append(div)
  window.plot = plot_model
  myrender  =  ->
    view = new plot_model.default_view(model: plot_model)
    div.append(view.$el)
  _.defer(myrender)
)

test('datarangeselect_test', () ->
  expect(0)
  plot_model = make_glyph_plot(data_source, defaults, glyph, xrange, yrange, {})
  tool = Collections("DataRangeBoxSelectionTool").create(
    plot : plot_model.ref()
  )
  boxselectionoverlay = Collections('BoxSelectionOverlay').create(
    tool : tool.ref()
  )
  plot_model.add_renderers([boxselectionoverlay.ref()])
  plot_model.get('tools').push(tool.ref())
  tool.on("change:xselect change:yselect", ()->
    console.log(tool.get('xselect'))
    console.log(tool.get('yselect'))
  )
  div = $('<div></div>')
  $('body').append(div)
  window.plot = plot_model
  myrender  =  ->
    view = new plot_model.default_view(model: plot_model)
    div.append(view.$el)
  _.defer(myrender)
)