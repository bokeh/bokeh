Collections = require('../base').Collections
make_glyph_test = require('./test_utils').make_glyph_test



x = ( (x/30) for x in _.range(600) )
y = (Math.sin(y) for y in x)
widths = (0.01 for i in x)
heights = (0.2 for i in x)
colors = ("rgb(#{ Math.floor(155+100*val) }, #{ Math.floor(180-50*val) }, #{ Math.floor(100+50*val) })" for val in y)
source = Collections('ColumnDataSource').create(
  data:
    x: x
    y: y
    width: widths
    height: heights
    fill: colors
)

xdr = Collections('DataRange1d').create(
  sources : [{ref : source.ref(), columns : ['x']}]
)

ydr = Collections('DataRange1d').create(
  sources : [{ref : source.ref(), columns : ['y']}]
)

defaults = {
  x : {field:'x', units: 'data'}
  y : {field:'y', units: 'data'}
  width: {field:'width', units: 'data'}
  height: {field:'height', units:'data'}
  fill: {field:'fill', units:'data'}
}

rect_fast = {
    fill : 'red',
    type : 'rect',
    line_color : null
    fast_path : true
    angle: 0
  }

test('rect_perf_fast', make_glyph_test('rect_perf_fast', source, defaults, [rect_fast], xdr, ydr, true, [800, 400]))




xdr = Collections('DataRange1d').create(
  sources : [{ref : source.ref(), columns : ['x']}]
)

ydr = Collections('DataRange1d').create(
  sources : [{ref : source.ref(), columns : ['y']}]
)

rect_slow = {
    type : 'rect',
    fill: {field:'fill', units:'data'}
    line_color : null
    angle: 0.1
  }

test('rect_perf_slow', make_glyph_test('rect_perf_slow', source, defaults, [rect_slow], xdr, ydr, true, [800, 400]))
