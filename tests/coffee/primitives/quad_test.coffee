Collections = require('base').Collections
make_glyph_test = require('testutils').make_glyph_test

xrange = Collections('Range1d').create({start: 0, end: 10})
yrange = Collections('Range1d').create({start: 0, end: 10})

data_source = Collections('ObjectArrayDataSource').create(
  data : [
    {left: 1, right: 1.75, bottom: 5, top: 6},
    {left: 2, right: 3.00, bottom: 4, top: 4.75},
    {left: 3, right: 3.75, bottom: 3, top: 3.75, fill: 'red'},
    {left: 4, right: 4.75, bottom: 2, top: 3.75, fill_alpha : 0.3},
    {left: 5, right: 5.76, bottom: 1, top: 1.75},
  ]
)

defaults = {}

glyph = {
  type: 'quad'
  fill: 'blue'
  left: 'left'
  right: 'right'
  bottom: 'bottom'
  top: 'top'
}

test('quad_glyph', make_glyph_test('quad_glyph', data_source, defaults, glyph, xrange, yrange, {}))

data_source = Collections('ObjectArrayDataSource').create(
  data : [
    {left: .5, right: 1.45, bottom: 5, top: 6},
    {left: 2, right: 2.92, bottom: 4.2, top: 4.75, lwidth: 7},
    {left: 3, right: 3.75, bottom: 3, top: 3.75, lwidth: 4},
    {left: 4, right: 4.75, bottom: 2, top: 3.75, fill_alpha : 0.3},
    {left: 5, right: 5.76, bottom: 1, top: 1.75, lwidth: 2},
  ]
)

glyph = {
  type: 'quad'
  line_width:
    field: 'lwidth'
    default: .5
  fill: 'blue'
  left: 'left'
  right: 'right'
  bottom: 'bottom'
  top: 'top'
}

test('quad_glyph_linewidth', make_glyph_test('quad_glyph_linewidth', data_source, defaults, glyph, xrange, yrange, {reference_point:3}))

data_source = Collections('ObjectArrayDataSource').create(
  data : [
    {left: .5, right: 1.45, bottom: 5, top: 6},
    {left: 2, right: 2.92, bottom: 4.2, top: 5, alpha: .2},
    {left: 2.75, right: 3.62, bottom: 3, top: 3.75, alpha: .4},
    {left: 4, right: 4.75, bottom: 2, top: 3.75, alpha: .6},
    {left: 5, right: 5.76, bottom: 1, top: 1.75, alpha: .8},
  ]
)

glyph = {
  type: 'quad'
  line_width: 5
  fill_alpha: 0.2
  line_alpha:
    field: 'alpha'
    default: 0
  fill: 'grey'
  left: 'left'
  right: 'right'
  bottom: 'bottom'
  top: 'top'
}

test('quad_glyph_line_alpha', make_glyph_test('quad_line_alpha', data_source, defaults, glyph, xrange, yrange, {}))

data_source = Collections('ObjectArrayDataSource').create(
  data : [
    {left: .5, right: 1.45, bottom: 5, top: 6, color: 'green'},
    {left: 2, right: 2.92, bottom: 4.2, top: 4.75, lwidth: 7},
    {left: 3, right: 3.75, bottom: 3, top: 3.75, lwidth: 4},
    {left: 4, right: 4.75, bottom: 2, top: 3.75, fill_alpha : 0.3, color: 'orange'},
    {left: 5, right: 5.76, bottom: 1, top: 1.75, lwidth: 2},
  ]
)

glyph = {
  type: 'quad'
  fill:
    field: 'color'
    default: 'blue'
  left: 'left'
  right: 'right'
  bottom: 'bottom'
  top: 'top'
}

test('quad_glyph_fill', make_glyph_test('quad_glyph_fill', data_source, defaults, glyph, xrange, yrange, {}))


data_source = Collections('ObjectArrayDataSource').create(
  data : [
    {left: .5, right: 1.45, bottom: 5, top: 6, dash: [1,1]},
    {left: 2, right: 2.92, bottom: 4.2, top: 4.75, lwidth: 7},
    {left: 3, right: 3.75, bottom: 3, top: 3.75, lwidth: 4},
    {left: 4, right: 4.75, bottom: 2, top: 3.75, fill_alpha : 0.3, dash: [1, 1, 2, 1]},
    {left: 5, right: 5.76, bottom: 1, top: 1.75, lwidth: 2},
  ]
)

glyph = {
  type: 'quad'
  line_width: 4
  line_dash:
    field: 'dash'
    default: [2,2]
  left: 'left'
  right: 'right'
  bottom: 'bottom'
  top: 'top'
}

test('quad_glyph_linedash', make_glyph_test('quad_glyph_linedash', data_source, defaults, glyph, xrange, yrange, {}))
