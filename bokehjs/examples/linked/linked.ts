namespace LinkedBrushingAndPanning {
  import plt = Bokeh.Plotting;
  import linspace = Bokeh.LinAlg.linspace;

  Bokeh.set_log_level("info");
  Bokeh.logger.info(`Bokeh ${Bokeh.version}`);

  const N = 100
  const x = linspace(0, 4*Math.PI, N)
  const y1 = x.map((xi) => Math.sin(xi))
  const y2 = x.map((xi) => Math.cos(xi))
  const y3 = x.map((xi) => Math.sin(xi) + Math.cos(xi))

  const source = new Bokeh.ColumnDataSource()
  const tools = "pan,box_select"

  // linked brushing is expressed by sharing data sources between renderers
  const s1 = plt.figure({width: 350, height: 350, tools: tools})
  s1.circle(x, y1, {source: source, color: "navy", size: 8, alpha: 0.5})

  // linked panning is expressed by sharing ranges between plots
  const s2 = plt.figure({width: 350, height: 350, tools: tools, x_range: s1.x_range, y_range: s1.y_range})
  s2.circle(x, y2, {source: source, color: "firebrick", size: 8, alpha: 0.5})

  // it is possible to share just one range or the other
  const s3 = plt.figure({width: 350, height: 350, tools: tools, x_range: s1.x_range})
  s3.circle(x, y3, {source: source, color: "olive", size: 8, alpha: 0.5})

  plt.show(plt.gridplot([[s1, s2, s3]]))
}
