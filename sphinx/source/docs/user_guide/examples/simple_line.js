// create some data and a ColumnDataSource
var x = Bokeh.LinAlg.linspace(-0.5, 20.5, 10);
var y = x.map(function (v) { return v * 0.5 + 3.0; });
var source = new Bokeh.ColumnDataSource({data: {x: x, y: y}});

// create some ranges for the plot
var xdr = new Bokeh.Range1d({start: -0.5, end: 20.5});
var ydr = new Bokeh.Range1d({start: -0.5, end: 20.5});

// make the plot
var plot = new Bokeh.Plot({
    title: "BokehJS Plot",
    x_range: xdr,
    y_range: ydr,
    plot_width: 400,
    plot_height: 400,
    background_fill_color: "#F2F2F7"
});

// add axes to the plot
var x_axis = new Bokeh.LinearAxis({axis_line_color: null});
var y_axis = new Bokeh.LinearAxis({axis_line_color: null});
plot.add_layout(x_axis, "below");
plot.add_layout(y_axis, "left");

// add grids to the plot
var x_grid = new Bokeh.Grid({ticker: x_axis.ticker, dimension: 0});
var y_grid = new Bokeh.Grid({ticker: y_axis.ticker, dimension: 1});
plot.add_layout(x_grid);
plot.add_layout(y_grid);

// add a Line glyph
var line = new Bokeh.Line({
    x: {field: "x"},
    y: {field: "y"},
    line_color: "#666699",
    line_width: 2
});
plot.add_glyph(line, source);

Bokeh.Plotting.show(plot);
