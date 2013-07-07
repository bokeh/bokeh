Collections = require('../base').Collections
make_glyph_test = require('../testutils').make_glyph_test


source = Collections('ColumnDataSource').create(
  data:
    left: [0.6, 1.6, 2.6, 3.6, 4.6, 5.6, 6.6, 7.6, 8.6]
    right: [1.4, 2.4, 3.4, 4.4, 5.4, 6.4, 7.4, 8.4, 9.4]
    a: [0,0,0,0,0,0,0,0,0]
    b: [20,25,26,27,22,17,12,6,6]
    c: [60,55,53,50,49,46,42,38,40]
    d: [60,55,56,60,62,69,75,77,78]
    e: [80,85,90,92,94,97,99,100,100]
    f: [100,100,100,100,100,100,100,100,100]
)

xdr = Collections('Range1d').create({start: 0, end: 11})
ydr = Collections('Range1d').create({start: 0, end: 100})

a = {
  left: 'left'
  right: 'right'
  top: 'b'
  bottom: 'a'
  type: 'quad',
  fill: '#A6CEE3'
  line_color: null
}

b = {
  left: 'left'
  right: 'right'
  top: 'c'
  bottom: 'b'
  type: 'quad',
  fill: '#1F78B4'
  line_color: null
}

c = {
  left: 'left'
  right: 'right'
  top: 'd'
  bottom: 'c'
  type: 'quad',
  fill: '#FB9A99'
  line_color: null
}

d = {
  left: 'left'
  right: 'right'
  top: 'e'
  bottom: 'd'
  type: 'quad',
  fill: '#33A02C'
  line_color: null
}

e = {
  left: 'left'
  right: 'right'
  top: 'f'
  bottom: 'e'
  type: 'quad',
  fill: '#B2DF8A'
  line_color: null
}

title = "Stacked Bars Example"
test(
  'stack',
  make_glyph_test('stack', source, {}, [a,b,c,d,e], xdr, ydr, {dims:[600, 600], tools:false, plot_title:title})
)


