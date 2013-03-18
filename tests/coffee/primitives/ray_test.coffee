Collections = require('../../base').Collections
make_glyph_test = require('../../testutils').make_glyph_test

range = Collections('Range1d').create({start: 0, end: 10})

data_source = Collections('ObjectArrayDataSource').create(
  data: [
    {x: 1, y: 5, angle: 1.3, length: 0},
    {x: 2, y: 4, angle: 1.2, length: 40, line_color: 'blue'},
    {x: 3, y: 3, angle: 1.1, length: 30},
    {x: 4, y: 2, angle: 1.0, length: 20},
    {x: 5, y: 1, angle: 0.9, length: 10},
  ]
)

defaults = {}

glyph = {
  type: 'ray'
  x: 'x'
  y: 'y'
  angle: 'angle'
  length: 'length'
}

test('ray_glyph', make_glyph_test('ray_glyph', data_source, defaults, glyph, range, range))
