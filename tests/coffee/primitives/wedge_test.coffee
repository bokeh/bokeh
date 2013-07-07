Collections = require('../../base').Collections
make_glyph_test = require('../testutils').make_glyph_test

xrange = Collections('Range1d').create({start: 0, end: 10})
yrange = Collections('Range1d').create({start: 0, end: 10})

data_source = Collections('ObjectArrayDataSource').create(
  data: [
    {x: 1, y: 5, radius:10},
    {x: 2, y: 4, direction: 'clock'},
    {x: 3, y: 3, fill: 'red'},
    {x: 4, y: 2, radius: 8, fill_alpha: 0.3},
    {x: 5, y: 1},
  ]
)

defaults = {
  radius: 10
  start_angle: 0.1
  end_angle: 3.9
}

glyph = {
  type: 'wedge'
  fill: 'blue'
  x: 'x'
  y: 'y'
}

test('wedge_glyph', make_glyph_test('wedge_glyph', data_source, defaults, glyph, xrange, yrange, {}))
