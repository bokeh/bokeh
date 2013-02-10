Collections = require('../../base').Collections
make_glyph_test = require('../test_utils').make_glyph_test

range = Collections('Range1d').create({start: 0, end: 10})

data_source = Collections('ObjectArrayDataSource').create(
  data : [
    {left : 1, right : 2, bottom : 5, top : 6},
    {left : 2, right : 3, bottom : 4, top : 5},
    {left : 3, right : 4, bottom : 3, top : 4, fill: "red"},
    {left : 4, right : 5, bottom : 2, top : 3, fill_alpha : 0.3},
    {left : 5, right : 6, bottom : 1, top : 2},
  ]
)

defaults = {
  left : 'left'
  right : 'right'
  bottom : 'bottom'
  top : 'top'
}

glyphs = [
    type : 'quad'
    fill: 'blue'
  ,
]

test('quad_glyph', make_glyph_test('quad_glyph', data_source, defaults, glyphs, range, range))
