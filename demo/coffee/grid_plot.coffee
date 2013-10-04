
Collections = require('../base').Collections
make_glyph_plot = require('../testutils').make_glyph_plot
Rand = require('../common/random').Rand

xs = ((x/50) for x in _.range(0, 630, 10))
ys1 = (Math.sin(x) for x in xs)
ys2 = (Math.cos(x) for x in xs)

# I want to have the last plot be unlinked
xs2 = ((x/50) for x in _.range(0, 630, 10))
ys3 = (Math.sin(x) for x in xs)
ys4 = (Math.cos(x) for x in xs)

source = Collections('ColumnDataSource').create(
  data:
    x: xs
    y1: ys1
    y2: ys2)

source2 = Collections('ColumnDataSource').create(
  data:
    x: xs2
    y1: ys3
    y2: ys4)

xdr = Collections('DataRange1d').create(
  sources: [{ref: source.ref(), columns: ['x']}])

ydr = Collections('DataRange1d').create(
  sources: [{ref: source.ref(), columns: ['y1']}])

ydr2 = Collections('DataRange1d').create(
  sources: [{ref: source.ref(), columns: ['y2']}])

ydr3 = Collections('DataRange1d').create(
  sources: [{ref: source.ref(), columns: ['y2']}])

ydr4 = Collections('DataRange1d').create(
  sources: [{ref: source.ref(), columns: ['y2']}])



xdr2 = Collections('DataRange1d').create(
  sources: [{ref: source2.ref(), columns: ['x']}])

ydr5 = Collections('DataRange1d').create(
  sources: [{ref: source2.ref(), columns: ['y2']}])

ydr6 = Collections('DataRange1d').create(
  sources: [{ref: source2.ref(), columns: ['y2']}])

scatter1 = {
  x: 'x'
  y: 'y1'
  radius: 8
  radius_units: 'screen'
  type: 'circle'
  fill_color: 'red'
  line_color: 'black'
  fast_path: true}

scatter2 = {
  x: 'x'
  y: 'y2'
  width: 5
  height: 5
  width_units: "screen"
  height_units: "screen"
  type: 'rect'
  fill_color: 'blue'
  fast_path: true}

plot1 = make_glyph_plot(source, {}, scatter1, xdr, ydr,
        {dims: [400,400], plot_title: "Plot 1", legend_name: "plot1"})
plot2 = make_glyph_plot(source, {}, scatter2, xdr, ydr2,
        {dims: [400,400], plot_title: "Plot 2", legend_name: "plot2"})
plot3 = make_glyph_plot(source, {}, scatter1, xdr, ydr3,
        {dims: [400,400], plot_title: "Plot 3", legend_name: "plot3"})
plot4 = make_glyph_plot(source2, {}, scatter2, xdr2, ydr6,
        {dims: [400,400], plot_title: "Plot 4", legend_name: "plot4"})

gridplot = Collections('GridPlot').create(
    children: [[plot1.ref(), plot2.ref()], [plot3.ref(), plot4.ref()]],
    )

window.gridplot = gridplot
test(
  'gridplot',
  () ->
    div = $('<div class="plotdiv"></div>')
    $('body').append(div)
    myrender = ->
      gridview = new gridplot.default_view(model: gridplot)
      window.gridview = gridview
      div.append(gridview.$el)
      console.log('Grid Plot Test')
    _.defer(myrender)
)

# _.delay((->  gridview.startPan()),  1000)