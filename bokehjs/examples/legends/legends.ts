namespace Legends {
  import plt = Bokeh.Plotting
  import linspace = Bokeh.LinAlg.linspace

  console.log(`Bokeh ${Bokeh.version}`);
  Bokeh.set_log_level("info");

  const x = linspace(0, 4*Math.PI, 100)
  const y = x.map((v) => Math.sin(v))

  const y2 = y.map((v) => 2*v)
  const y3 = y.map((v) => 3*v)

  const xr = new Bokeh.DataRange1d();
  const yr = new Bokeh.DataRange1d();
  const p1 = plt.figure({title: "Legends Example", x_range: xr, y_range: yr})

  p1.circle(x, y,  {legend: "sin(x)"})
  p1.circle(x, y2, {legend: "2*sin(x)", color: "orange"})
  p1.circle(x, y3, {legend: "3*sin(x)", color: "green"})

  const p2 = plt.figure({title: "Another Legend Example", x_range: xr, y_range: yr})

  p2.circle(x, y, {legend: "sin(x)"})
  p2.line(x, y, {legend: "sin(x)"})

  p2.line(x, y2, {legend: "2*sin(x)", /*line_dash: [4, 4],*/ line_color: "orange", line_width: 2})

  p2.square(x, y3, {legend: "3*sin(x)", fill_color: null, line_color: "green"})
  p2.line(x, y3, {legend: "3*sin(x)", line_color: "green"})

  plt.show(new Bokeh.Column({children: [p1, p2]}))
}
