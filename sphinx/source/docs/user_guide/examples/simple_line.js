// create some data and a ColumnDataSource
const x = Bokeh.LinAlg.linspace(-0.5, 20.5, 10);
const y = x.map(function (v) { return v * 0.5 + 3.0; });
const source = new Bokeh.ColumnDataSource({ data: { x: x, y: y } });

// create some ranges for the plot
const xdr = new Bokeh.Range1d({ start: -0.5, end: 20.5 });
const ydr = new Bokeh.Range1d({ start: -0.5, end: 20.5 });

// make the plot
const plot = new Bokeh.Plot({
    title: "BokehJS Plot",
    x_range: xdr,
    y_range: ydr,
    width: 400,
    height: 400,
    background_fill_color: "#F2F2F7"
});

// add axes to the plot
const xaxis = new Bokeh.LinearAxis({ axis_line_color: null });
const yaxis = new Bokeh.LinearAxis({ axis_line_color: null });
plot.add_layout(xaxis, "below");
plot.add_layout(yaxis, "left");

// add grids to the plot
const xgrid = new Bokeh.Grid({ ticker: xaxis.ticker, dimension: 0 });
const ygrid = new Bokeh.Grid({ ticker: yaxis.ticker, dimension: 1 });
plot.add_layout(xgrid);
plot.add_layout(ygrid);

// add a Line glyph
const line = new Bokeh.Line({
    x: { field: "x" },
    y: { field: "y" },
    line_color: "#666699",
    line_width: 2
});
plot.add_glyph(line, source);

Bokeh.Plotting.show(plot);
