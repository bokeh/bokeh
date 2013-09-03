
Collections = require('../base').Collections
make_glyph_test = require('../testutils').make_glyph_test
Rand = require('../common/random').Rand

xs = ((x/50) for x in _.range(630))
ys1 = (Math.sin(x) for x in xs)
ys2 = (Math.cos(x) for x in xs)

source = Collections('ColumnDataSource').create(
  data:
    x: xs
    y1: ys1
    y2: ys2
)

xdr = Collections('DataRange1d').create(
  sources: [{ref: source.ref(), columns: ['x']}]
)

ydr = Collections('DataRange1d').create(
  sources: [{ref: source.ref(), columns: ['y1']}]
)

ydr2 = Collections('DataRange1d').create(
  sources: [{ref: source.ref(), columns: ['y2']}]
)

scatter1 = {
  x: 'x'
  y: 'y1'
  radius: 8
  radius_units: 'screen'
  type: 'circle'
  fill_color: 'red'
  line_color: 'black'
}

scatter2 = {
  x: 'x'
  y: 'y2'
  width: 5
  height: 5
  type: 'rects'
  fill_color: 'blue'
}

plot1 = make_glyph_test("plot1", source, {}, scatter1, xdr, ydr,
        {dims: [600,600], plot_title: "Plot 1"})
plot2 = make_glyph_test("plot2", source, {}, scatter2, xdr, ydr2,
        {dims: [600,600], plot_title: "Plot 2"})

gridplot = Collections('GridPlotContainer').create(children: [[plot1, plot2]])

test(
  'gridplot',
  gridplot
)

