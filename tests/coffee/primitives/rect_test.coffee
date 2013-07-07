Collections = require('../../base').Collections
make_glyph_test = require('../testutils').make_glyph_test

xrange = Collections('Range1d').create({start: 0, end: 10})
yrange = Collections('Range1d').create({start: 0, end: 10})

data_source = Collections('ObjectArrayDataSource').create(
  data: [
    {x: 1, y: 5},
    {x: 2, y: 4, angle: -0.4},
    {x: 3, y: 3, fill: 'red'},
    {x: 4, y: 2, fill_alpha: 0.3},
    {x: 5, y: 1},
  ]
)

defaults = {
  width: 12
  width_units: 'screen'
  height: 15
  height_units: 'screen'
}

glyph = {
  type: 'rect'
  fill: 'blue'
  x: 'x'
  y: 'y'
}

test('rect_glyph', make_glyph_test('rect_glyph', data_source, defaults, glyph, xrange, yrange, {}))

data_source = Collections('ObjectArrayDataSource').create(
  data: [
    {x: 1, y: 5, angle: 0.0},
    {x: 2, y: 4, angle: 0.2},
    {x: 3, y: 3, angle: 0.4},
    {x: 4, y: 2, angle: 0.6},
    {x: 5, y: 1},
  ]
)

glyph = {
  angle:
    field: 'angle'
    default: 1.2
  fill_alpha: 0.5
  type: 'rect'
  fill: 'blue'
  x: 'x'
  y: 'y'
}

test('rect_glyph_angle', make_glyph_test('rect_glyph_angle', data_source, defaults, glyph, xrange, yrange, {}))

data_source = Collections('ObjectArrayDataSource').create(
  data: [
    {x: 1, y: 5, lwidth: 7},
    {x: 2, y: 4, lwidth: 4},
    {x: 3, y: 3},
    {x: 4, y: 2, lwidth: 2},
    {x: 5, y: 1},
  ]
)

glyph = {
  angle: 0
  line_width:
    field: 'lwidth'
    default: .5
  type: 'rect'
  fill: 'blue'
  x: 'x'
  y: 'y'
}

test('rect_glyph_line_width', make_glyph_test('rect_glyph_line_width', data_source, defaults, glyph, xrange, yrange,
{reference_point:{x: 4, y: 2, lwidth:4}}))

data_source = Collections('ObjectArrayDataSource').create(
  data: [
    {x: 1, y: 5},
    {x: 2, y: 4, alpha: .2},
    {x: 3, y: 3, alpha: .4},
    {x: 4, y: 2, alpha: .6},
    {x: 5, y: 1, alpha: .8},
  ]
)

glyph = {
  angle: 0
  line_width: 5
  fill_alpha: 0.2
  line_alpha:
    field: 'alpha'
    default: 0
  type: 'rect'
  fill: 'grey'
  height: 22
  width: 18
  x: 'x'
  y: 'y'
}

test('rect_glyph_line_alpha', make_glyph_test('rect_glyph_line_alpha', data_source, defaults, glyph, xrange, yrange, {}))

data_source = Collections('ObjectArrayDataSource').create(
  data: [
    {x: 1, y: 5, color: 'green'},
    {x: 2, y: 4},
    {x: 3, y: 3},
    {x: 4, y: 2, color: 'orange'},
    {x: 5, y: 1},
  ]
)

glyph = {
  angle: 0
  type: 'rect'
  fill:
    field: 'color'
    default: 'blue'
  x: 'x'
  y: 'y'
}

test('rect_glyph_fill', make_glyph_test('rect_glyph_fill', data_source, defaults, glyph, xrange, yrange, {}))

data_source = Collections('ObjectArrayDataSource').create(
  data: [
    {x: 1, y: 5, dash: [1,1]},
    {x: 2, y: 4},
    {x: 3, y: 3},
    {x: 4, y: 2, dash: [1,1,2,1]},
    {x: 5, y: 1},
  ]
)

glyph = {
  angle: 0
  line_width: 4
  line_dash:
    field: 'dash'
    default: [2,2]
  type: 'rect'
  fill: 'grey'
  fill_alpha: 0.2
  height: 40
  width: 20
  x: 'x'
  y: 'y'
}

test('rect_glyph_linedash', make_glyph_test('rect_glyph_linedash', data_source, defaults, glyph, xrange, yrange, {}))


data_source = Collections('ObjectArrayDataSource').create(
  data: [
    {x: 1.5, y: 1, height: 40},
    {x: 4, y: 1, height: 40},
    {x: 3, y: .5, height: 20, fill: 'brown'},
    {x: 1.6, y: 2.2, height: 70, angle: -.8, line_color: 'purple', fill: 'purple'},
    {x: 3.4, y: 3.3, height: 20, fill: 'red'},
    {x: 3.9, y: 2.2, height: 70, angle: -2.3, line_color: 'purple', fill: 'purple'},
    {x: 7, y: .5, height: 35, fill: 'brown'},
    {x: 6.6, y: 1.6, height: 20, angle: -.8, line_color: 'green', fill: 'green'},
    {x: 6.6, y: 2, height: 20, angle: -.8, line_color: 'green', fill: 'green'},
    {x: 6.6, y: 2.5, height: 20, angle: -.8, line_color: 'green', fill: 'green'},
    {x: 7.4, y: 1.6, height: 20, angle: -2.3, line_color: 'green', fill: 'green'},
    {x: 7.4, y: 2, height: 20, angle: -2.3, line_color: 'green', fill: 'green'},
    {x: 7.4, y: 2.4, height: 20, angle: -2.3, line_color: 'green', fill: 'green'}
  ]
)

glyph = {
  angle:
    field: 'angle'
    default: 0
  fill_alpha: 1
  type: 'rect'
  fill: 'blue'
  x: 'x'
  y: 'y'
}

test('rect_glyph_house', make_glyph_test('rect_glyph_house', data_source, defaults, glyph, xrange, yrange, {}))
