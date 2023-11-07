import Bokeh from "/static/js/bokeh.esm.js"
import "/static/js/bokeh-api.esm.js"

export namespace Legends {
  import plt = Bokeh.Plotting
  import linspace = Bokeh.LinAlg.linspace

  console.log(`Bokeh ${Bokeh.version}`)
  Bokeh.set_log_level("info")

  const x = linspace(0, 4*Math.PI, 100)
  const y = x.map((v) => Math.sin(v + Math.PI))

  const y2 = y.map((v) => 2*v)
  const y3 = y.map((v) => 3*v)

  const xr = new Bokeh.DataRange1d()
  const yr = new Bokeh.DataRange1d()
  const p1 = plt.figure({title: "Legends Example", x_range: xr, y_range: yr})
  p1.legend.location = "top_left"

  p1.scatter(x, y,  {legend_label: "sin(x)"})
  p1.scatter(x, y2, {legend_label: "2*sin(x)", color: "orange"})
  p1.scatter(x, y3, {legend_label: "3*sin(x)", color: "green"})

  const p2 = plt.figure({title: "Another Legend Example", x_range: xr, y_range: yr})
  p2.legend.location = "top_left"

  p2.scatter(x, y, {legend_label: "sin(x)"})
  p2.line(x, y, {legend_label: "sin(x)"})

  p2.line(x, y2, {legend_label: "2*sin(x)", line_dash: [4, 4], line_color: "orange", line_width: 2})

  p2.scatter(x, y3, {legend_label: "3*sin(x)", marker: "square", fill_color: null, line_color: "green"})
  p2.line(x, y3, {legend_label: "3*sin(x)", line_color: "green"})

  void plt.show(new Bokeh.Column({children: [p1, p2]}))
}
