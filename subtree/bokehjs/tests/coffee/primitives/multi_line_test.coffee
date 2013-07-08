Collections = require('../../base').Collections
make_glyph_test = require('../testutils').make_glyph_test

xrange = Collections('Range1d').create({start: 0, end: 10})
yrange = Collections('Range1d').create({start: 0, end: 10})

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
  type: 'multi_line'
  xs: 'xs'
  ys: 'ys'
}

test('line_glyph', make_glyph_test('line_glyph', data_source, defaults, glyph, xrange, yrange, {}))

data_source = Collections('ObjectArrayDataSource').create(
  data: [
    {xs: [2,3,4,5,6,7,8], ys: [1,2,3,4,3,2,1]},
    {xs: [2,3,4,5,6,7,8], ys: [9,8,7,6,5,4,3], lwidth: 4},
    {xs: [2,3,4,5,6,7,8], ys: [3,4,5,6,7,8,9], lwidth: 2},
    {xs: [2,3,4,5,6,7,8], ys: [7,7,7,7,7,7,7], lwidth: 1.5},
  ]
)


glyph = {
  type: 'multi_line'
  line_width:
    field: 'lwidth'
    default: .5
  xs: 'xs'
  ys: 'ys'
}

test('line_glyph_line_width', make_glyph_test('line_glyph_line_width', data_source, defaults, glyph, xrange, yrange, {}))

data_source = Collections('ObjectArrayDataSource').create(
  data: [
    {xs: [2,3,4,5,6,7,8], ys: [1,2,3,4,3,2,1], alpha: .2},
    {xs: [2,3,4,5,6,7,8], ys: [9,8,7,6,5,4,3], alpha: .4},
    {xs: [2,3,4,5,6,7,8], ys: [3,4,5,6,7,8,9], alpha: .6},
    {xs: [2,3,4,5,6,7,8], ys: [7,7,7,7,7,7,7], alpha: .8},
  ]
)


glyph = {
  type: 'multi_line'
  line_alpha:
    field: 'alpha'
    default: 0
  xs: 'xs'
  ys: 'ys'
}

test('line_glyph_line_alpha', make_glyph_test('line_glyph_line_alpha', data_source, defaults, glyph, xrange, yrange, {}))

data_source = Collections('ObjectArrayDataSource').create(
  data: [
    {xs: [2,3,4,5,6,7,8], ys: [1,2,3,4,3,2,1], dash: [1,1], lwidth: 4},
    {xs: [2,3,4,5,6,7,8], ys: [9,8,7,6,5,4,3], lwidth: 1},
    {xs: [2,3,4,5,6,7,8], ys: [3,4,5,6,7,8,9], lwidth: 6},
    {xs: [2,3,4,5,6,7,8], ys: [7,7,7,7,7,7,7], dash: [1,1,2,1], lwdith: 2},
  ]
)

glyph = {
  type: 'multi_line'
  line_width:
    field: 'lwidth'
    default: .5
  line_dash:
    field: 'dash'
    default: [2,2]
  xs: 'xs'
  ys: 'ys'
}

test('line_glyph_linedash', make_glyph_test('line_glyph_linedash', data_source, defaults, glyph, xrange, yrange, {}))
