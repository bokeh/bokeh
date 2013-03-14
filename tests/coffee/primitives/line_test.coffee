Collections = require('../../base').Collections
make_glyph_test = require('../../testutils').make_glyph_test

range = Collections('Range1d').create({start: 0, end: 10})

data_source = Collections('ObjectArrayDataSource').create(
  data: [
    {xs: [2,3,4,5,6,7,8], ys: [1,2,3,4,3,2,1]},
    {xs: [2,3,4,5,6,7,8], ys: [9,8,7,6,5,4,3], line_color: 'orange'},
    {xs: [2,3,4,5,6,7,8], ys: [3,4,5,6,7,8,9], line_color: 'blue', line_dash: [4,6]},
    {xs: [2,3,4,5,6,7,8], ys: [7,7,7,7,7,7,7], line_width: 6, line_color: 'green', line_alpha: 0.4},
  ]
)

defaults = {}

glyph = {
  type: 'line'
  xs: 'xs'
  ys: 'ys'
}

test('line_glyph', make_glyph_test('line_glyph', data_source, defaults, glyph, range, range))
