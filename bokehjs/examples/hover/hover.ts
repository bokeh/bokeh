namespace HoverfulScatter {
  import plt = Bokeh.Plotting;
  const {range, zip} = Bokeh.LinAlg;

  Bokeh.set_log_level("info");
  Bokeh.logger.info(`Bokeh ${Bokeh.version}`);

  const random = (function() {
    let seed = 1
    return function() { // Park-Miller LCG
      seed = (seed*48271) % 2147483647 // 1 <= seed < 2^31 - 1
      return (seed - 1) / 2147483646
    }
  })()

  const M = 100
  const xx: number[] = []
  const yy: number[] = []

  for (let y = 0; y <= M; y += 4) {
    for (let x = 0; x <= M; x += 4) {
      xx.push(x)
      yy.push(y)
    }
  }

  const N = xx.length
  const indices = range(N).map((i) => i.toString())
  const radii = range(N).map((_) => random()*0.4 + 1.7)

  const colors: string[] = []
  for (const [r, g] of zip(xx.map((x) => 50 + 2*x), yy.map((y) => 30 + 2*y)))
    colors.push(plt.color(r, g, 150))

  const source = new Bokeh.ColumnDataSource({
    data: {x: xx, y: yy, radius: radii, colors: colors },
  })

  const tools = "pan,crosshair,wheel_zoom,box_zoom,reset,hover,save"

  const p = plt.figure({title: "Hoverful Scatter", tools: tools})

  p.circle({field: "x"}, {field: "y"}, {source: source, radius: radii,
    fill_color: colors, fill_alpha: 0.6, line_color: null})

  p.text({field: "x"}, {field: "y"}, indices, {source: source, alpha: 0.5,
    text_font_size: "5pt", text_baseline: "middle", text_align: "center"})

  const hover = p.toolbar.select_one(Bokeh.HoverTool)
  hover.tooltips = (source: Bokeh.DataSource, info: Bokeh.HoverTooltipInfo) => {
    const ds = source as Bokeh.ColumnDataSource
    const div = document.createElement("div")
    div.style.width = "200px"
    div.style.height = "75px"
    div.style.backgroundColor = ds.data["colors"][info.index]
    return div
  }

  plt.show(p)
}
