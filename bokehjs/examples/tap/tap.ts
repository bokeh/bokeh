import * as Bokeh from "bokehjs"

export namespace TappyScatter {
  import plt = Bokeh.Plotting
  const {range, zip, Random} = Bokeh.LinAlg

  Bokeh.set_log_level("info")
  Bokeh.logger.info(`Bokeh ${Bokeh.version}`)

  const random = new Random(1)

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
  const radii = range(N).map((_) => random.float()*0.4 + 1.7)

  const colors: string[] = []
  for (const [r, g] of zip(xx.map((x) => 50 + 2*x), yy.map((y) => 30 + 2*y)))
    colors.push(plt.color(r, g, 150))

  const source = new Bokeh.ColumnDataSource({
    data: {x: xx, y: yy, radius: radii, colors },
  })

  const tools = "pan,crosshair,wheel_zoom,box_zoom,reset,tap,save"

  const p = plt.figure({title: "Tappy Scatter", tools})

  const circles = p.circle({field: "x"}, {field: "y"}, {
    source, radius: radii, fill_color: colors, fill_alpha: 0.6, line_color: null,
  })

  p.text({field: "x"}, {field: "y"}, indices, {
    source, alpha: 0.5, text_font_size: "7px", text_baseline: "middle", text_align: "center",
  })

  const tap = p.toolbar.select_one(Bokeh.TapTool)
  tap!.renderers = [circles]
  tap!.callback = {
    execute(_obj, {source}): void {
      const indices = source.selected.indices
      if (indices.length == 1)
        console.log(`Selected index: ${indices[0]}`)
      else if (indices.length > 1)
        console.log(`Selected indices: ${indices.join(', ')}`)
      else
        console.log("Nothing selected")
    },
  }

  plt.show(p)
}
