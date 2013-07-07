Collections = require('../../base').Collections
make_glyph_test = require('../testutils').make_glyph_test

xrange = Collections('Range1d').create({start: 0, end: 10})
yrange = Collections('Range1d').create({start: 0, end: 10})

data_source = Collections('ObjectArrayDataSource').create(
  data: [
    {x: 1, y: 7},
    {x: 3, y: 4},
    {x: 4, y: 1},
    {x: 8, y: 2},
    {x: 9, y: 3},
  ]
)

defaults = {
  fill_alpha: 0.5
}

glyph = {
  type: 'patch'
  x: 'x'
  y: 'y'
}

test('patch_glyph', make_glyph_test('patch_glyph', data_source, defaults, glyph, xrange, yrange, {}))

