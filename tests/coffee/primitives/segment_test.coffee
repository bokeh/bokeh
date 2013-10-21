Collections = require('../../base').Collections
make_glyph_test = require('../testutils').make_glyph_test

xrange = Collections('Range1d').create({start: 0, end: 10})
yrange = Collections('Range1d').create({start: 0, end: 10})

data_source = Collections('ObjectArrayDataSource').create(
  data: [
    {x0: 1, y0: 5, x1: 2, y1: 5.5},
    {x0: 2, y0: 4, x1: 3, y1: 4.5},
    {x0: 3, y0: 3, x1: 4, y1: 3.5},
    {x0: 4, y0: 2, x1: 5, y1: 2.5},
    {x0: 5, y0: 1, x1: 6, y1: 1.5},
  ]
)

defaults = {}

glyph = {
  type: 'segment'
  x0: 'x0'
  y0: 'y0'
  x1: 'x1'
  y1: 'y1'
}

test('segment_glyph', make_glyph_test('segment_glyph', data_source, defaults, glyph, xrange, yrange, {}))
