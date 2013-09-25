
Collections = require('../base').Collections
make_glyph_plot = require('../testutils').make_glyph_plot
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

ydr3 = Collections('DataRange1d').create(
  sources: [{ref: source.ref(), columns: ['y2']}]
)

ydr4 = Collections('DataRange1d').create(
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
  fast_path: true
}

scatter2 = {
  x: 'x'
  y: 'y2'
  width: 5
  height: 5
  width_units: "screen"
  height_units: "screen"
  type: 'rect'
  fill_color: 'blue'
  fast_path: true
}

plot1 = make_glyph_plot(source, {}, scatter1, xdr, ydr,
        {dims: [400,400], plot_title: "Plot 1", legend_name: "plot1"})
plot2 = make_glyph_plot(source, {}, scatter2, xdr, ydr2,
        {dims: [400,400], plot_title: "Plot 2", legend_name: "plot2"})

plot3 = make_glyph_plot(source, {}, scatter1, xdr, ydr3,
        {dims: [400,400], plot_title: "Plot 3", legend_name: "plot3"})
plot4 = make_glyph_plot(source, {}, scatter2, xdr, ydr4,
        {dims: [400,400], plot_title: "Plot 4", legend_name: "plot4"})

gridplot = Collections('GridPlot').create(children: [[plot1.ref(), plot2.ref()], [plot3.ref(), plot4.ref()]])

test(
  'gridplot',
  () ->
    div = $('<div class="plotdiv"></div>')
    $('body').append(div)
    myrender = ->
      gridview = new gridplot.default_view(model: gridplot)
      div.append(gridview.$el)
      console.log('Grid Plot Test')
    _.defer(myrender)
)

