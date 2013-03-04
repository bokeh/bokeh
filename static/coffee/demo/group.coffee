Collections = require('../base').Collections
make_glyph_test = require('../testutils').make_glyph_test


source = Collections('ColumnDataSource').create(
  data:
    al: [0.6, 4.6, 8.6]
    ar: [1.4, 5.4, 9.4]
    at: [6, 6, 5]
    ab: [0,0,0]
    bl: [1.6, 5.6, 9.6]
    br: [2.4, 6.4, 10.4]
    bt: [4, 7, 6]
    bb: [0,0,0]
    cl: [2.6, 6.6, 10.6]
    cr: [3.4, 7.4, 11.4]
    ct: [3, 5, 2]
    cb: [0,0,0]
)

xdr = Collections('Range1d').create({start: 0, end: 12})
ydr = Collections('Range1d').create({start: 0, end: 8})

a = {
  left: 'al'
  right: 'ar'
  top: 'at'
  bottom: 'ab'
  type: 'quad',
  fill: '#A6CEE3'
  line_color: null
}

b = {
  left: 'bl'
  right: 'br'
  top: 'bt'
  bottom: 'bb'
  type: 'quad',
  fill: '#1F78B4'
  line_color: null
}

c = {
  left: 'cl'
  right: 'cr'
  top: 'ct'
  bottom: 'cb'
  type: 'quad',
  fill: '#B2DF8A'
  line_color: null
}

test('group', make_glyph_test('group', source, {}, [a,b,c], xdr, ydr, false, [400, 400]))


