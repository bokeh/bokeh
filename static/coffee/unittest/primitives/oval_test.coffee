Collections = require('../../base').Collections
make_glyph_test = require('../test_utils').make_glyph_test

range = Collections('Range1d').create({start: 0, end: 10})


data_source = Collections('ObjectArrayDataSource').create(
  data : [
    {x : 1, y : 5},
    {x : 2, y : 4, angle: 0.2},
    {x : 3, y : 3, fill: "red"},
    {x : 4, y : 2, fill_alpha: 0.3},
    {x : 5, y : 1},
  ]
)

defaults = {
  x : 'x'
  y : 'y'
  width: 20
  width_units: "screen"
  height: 28
  height_units: "screen"
  angle: 0
}

glyphs = [
    type : 'oval'
    fill: 'blue'
  ,
]

test('oval_glyph', make_glyph_test('oval_glyph', data_source, defaults, glyphs, range, range))
