
xs = ((x/50) for x in _.range(630))
ys1 = (Math.sin(x) for x in xs)
ys2 = (Math.cos(x) for x in xs)

source = Bokeh.Collections('ColumnDataSource').create(
  data:
    x: xs
    y1: ys1
    y2: ys2
)

xdr = Bokeh.Collections('DataRange1d').create(
  sources: [{ref: source.ref(), columns: ['x']}]
)

ydr1 = Bokeh.Collections('DataRange1d').create(
  sources: [{ref: source.ref(), columns: ['y1']}]
)

ydr2 = Bokeh.Collections('DataRange1d').create(
  sources: [{ref: source.ref(), columns: ['y2']}]
)

scatter1 = {
  type: 'circle'
  x: 'x'
  y: 'y1'
  radius: 8
  radius_units: 'screen'
  fill_color: 'red'
  line_color: 'black'
}

scatter2 = {
  type: 'rect'
  x: 'x'
  y: 'y2'
  width: 5
  width_units: 'screen'
  height: 5
  height_units: 'screen'
  fill_color: 'blue'
}

options = {
  title: "Scatter Demo"
  dims: [600, 600]
  xrange: xdr
  xaxes: "min"
  yaxes: "min"
  tools: true
  legend: false
}

plot1 = Bokeh.Plotting.make_plot(scatter1, source, _.extend({title: "Plot 1", yrange: ydr1}, options))
plot2 = Bokeh.Plotting.make_plot(scatter2, source, _.extend({title: "Plot 2", yrange: ydr2}, options))

gridplot = Bokeh.Collections('GridPlot').create(children: [[plot1, plot2]])
Bokeh.Plotting.show(gridplot)
