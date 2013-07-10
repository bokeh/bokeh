Collections = require('../../base').Collections
make_glyph_test = require('../testutils').make_glyph_test

rangex = Collections('Range1d').create({start: 0, end: 25})
rangey = Collections('Range1d').create({start: 0, end: 25})

data_source = Collections('ObjectArrayDataSource').create(
  data: [
    {x: 1, y: 7},
    {x: 3, y: 4},
    {x: 6, y: 3},
    {x: 8, y: 2},
    {x: 9, y: 1},
    {x: 11, y: 3},
    {x: 13, y: NaN},
    {x: 15, y: 6},
    {x: 17, y: 6},
    {x: 19, y: 4},
    {x: 21, y: 2},
    {x: 23, y: 9},
  ]
)

defaults = {}

glyph = {
  type: 'line'
  x: 'x'
  y: 'y'
}

test('line_glyph', make_glyph_test('line_glyph', data_source, defaults, glyph, rangex, rangey, {}))
