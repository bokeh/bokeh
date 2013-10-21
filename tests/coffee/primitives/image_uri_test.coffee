Collections = require('../../base').Collections
make_glyph_test = require('../testutils').make_glyph_test

xrange = Collections('Range1d').create({start: 0, end: 10})
yrange = Collections('Range1d').create({start: 0, end: 10})

data_source = Collections('ObjectArrayDataSource').create(
  data: [
    {x: 1, y: 5},
    {x: 2, y: 4, url: 'http://localhost:5000/static/sad.png'},
    {x: 3, y: 3},
    {x: 4, y: 2},
    {x: 5, y: 1},
  ]
)

defaults = {
  url: 'http://localhost:5000/static/glad.png'
  angle: 0.3
}

glyph = {
  type: 'image_uri'
  x: 'x'
  y: 'y'
}

test('image_uri_glyph', make_glyph_test('image_uri_glyph', data_source, defaults, glyph, xrange, yrange, {}))
