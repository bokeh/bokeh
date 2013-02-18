Collections = require('../../base').Collections
make_glyph_test = require('../test_utils').make_glyph_test

range = Collections('Range1d').create({start: 0, end: 10})

data_source = Collections('ObjectArrayDataSource').create(
  data: [
    {x: 1, y: 5},
    {x: 2, y: 4, text: 'bar', text_color: 'orange'},
    {x: 3, y: 3},
    {x: 4, y: 2},
    {x: 5, y: 1},
  ]
)

defaults = {
  text: 'foo'
  angle: -0.2
}

glyph = {
  type: 'text'
  x: 'x'
  y: 'y'
}

test('text_glyph', make_glyph_test('text_glyph', data_source, defaults, glyph, range, range))

