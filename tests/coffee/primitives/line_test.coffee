Collections = require('../../base').Collections
make_glyph_test = require('../testutils').make_glyph_test

rangex = Collections('Range1d').create({start: 0, end: 10})
rangey = Collections('Range1d').create({start: 0, end: 10})

data_source = Collections('ObjectArrayDataSource').create(
  data: [
    {x: 1, y: 7},
    {x: 3, y: 4},
    {x: 6, y: 3},
    {x: 8, y: 2},
    {x: 9, y: 1},
  ]
)

defaults = {}

glyph = {
  type: 'line'
  x: 'x'
  y: 'y'
}

test('line_glyph', make_glyph_test('line_glyph', data_source, defaults, glyph, rangex, rangey, {}))
