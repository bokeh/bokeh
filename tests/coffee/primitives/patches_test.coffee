Collections = require('../../base').Collections
make_glyph_test = require('../testutils').make_glyph_test

xrange = Collections('Range1d').create({start: 0, end: 10})
yrange = Collections('Range1d').create({start: 0, end: 10})

data_source = Collections('ObjectArrayDataSource').create(
  data: [
    {xs: [2,3,4,5,6,7,8], ys: [1,2,3,4,3,2,1], fill: 'blue'},
    {xs: [2,3,4,5,6,7,8], ys: [9,8,7,6,5,4,5], line_color: 'orange'},
    {xs: [2,3,4,5,6,7,8], ys: [6,4,5,6,7,8,9], line_color: 'blue', line_dash: [3,2]},
    {xs: [2,3,4,5,6,7,8], ys: [7,8,9,9,9,9,8], line_width: 6, line_color: 'green', line_alpha: 0.4},
  ]
)

defaults = {
  fill_alpha: 0.5
}

glyph = {
  type: 'patches'
  xs: 'xs'
  ys: 'ys'
}

test('patches_glyph', make_glyph_test('patches_glyph', data_source, defaults, glyph, xrange, yrange, {}))

