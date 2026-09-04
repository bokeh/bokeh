// create some data and a ColumnDataSource
const x = Bokeh.LinAlg.linspace(-0.5, 20.5, 10);
const y = x.map(function (v) { return v * 0.5 + 3.0; });
const source = Bokeh.ColumnDataSource.create({ data: { x: x, y: y } });

// create some ranges for the plot
const xdr = Bokeh.Range1d.create({ start: -0.5, end: 20.5 });
const ydr = Bokeh.Range1d.create({ start: -0.5, end: 20.5 });

// make the plot
const plot = Bokeh.Plot.create({
    title: "BokehJS Plot",
    x_range: xdr,
    y_range: ydr,
    width: 400,
    height: 400,
    background_fill_color: "#F2F2F7"
});

// add axes to the plot
const xaxis = Bokeh.LinearAxis.create({ axis_line_color: null });
const yaxis = Bokeh.LinearAxis.create({ axis_line_color: null });
plot.add_layout(xaxis, "below");
plot.add_layout(yaxis, "left");

// add grids to the plot
const xgrid = Bokeh.Grid.create({ ticker: xaxis.ticker, dimension: 0 });
const ygrid = Bokeh.Grid.create({ ticker: yaxis.ticker, dimension: 1 });
plot.add_layout(xgrid);
plot.add_layout(ygrid);

// add a Line glyph
const line = Bokeh.Line.create({
    x: { field: "x" },
    y: { field: "y" },
    line_color: "#666699",
    line_width: 2
});
plot.add_glyph(line, source);

Bokeh.Plotting.show(plot);
