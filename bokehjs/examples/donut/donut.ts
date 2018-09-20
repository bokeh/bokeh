namespace WebBrowserMarketShare {
  import plt = Bokeh.Plotting;
  const {zip, unzip, sum, cumsum} = Bokeh.LinAlg;

  Bokeh.set_log_level("info");
  Bokeh.logger.info(`Bokeh ${Bokeh.version}`);

  function to_cartesian(r: number, alpha: number): [number, number] {
    return [r*Math.cos(alpha), r*Math.sin(alpha)]
  }

  function to_radians(x: number) {
    return 2*Math.PI*(x/100)
  }

  function read_csv_from(id: string) {
    const text = document.getElementById(id).innerHTML
    return text.split("\n")
         .map((line) => line.trim())
         .filter((line) => line.length > 0)
         .map((line) => line.split(/, /).map((val) => val.trim()))
  }

  interface MonthlyShares {
    year: number
    month: string
    browsers: string[]
    shares: number[]
  }

  const data: MonthlyShares[] = []

  let _browsers: string[] = null
  let year: number = null

  for (const [head, ...tail] of read_csv_from("data")) {
    const _year = parseInt(head)
    if (!isNaN(_year)) {
      [year, _browsers] = [_year, tail]
    } else {
      const month = head

      const shares = tail.map((val) => parseFloat(val))
      const browsers = _browsers.slice()

      for (let i = 0; i < shares.length;) {
        if (isNaN(shares[i])) {
          shares.splice(i, 1)
          browsers.splice(i, 1)
        } else
          i++
      }

      const other = 100 - sum(shares)
      if (other > 0) {
        browsers.push("Other")
        shares.push(other)
      }

      data.push({year: year, month: month, browsers: browsers, shares: shares})
    }
  }

  interface BrowserInfo {
    description?: string
    color?: Bokeh.Color
    icon?: string
  }

  const info: Bokeh.Map<BrowserInfo> = {
    Other: {color: "gray"},
  }

  for (const row of read_csv_from("info")) {
    const [browser, description, color, icon] = row
    info[browser] = {
      description: description,
      color: color,
      icon: icon,
    }
  }

  const fig = plt.figure({
    x_range: [-2, 2], y_range: [-2, 2],
    width: 600, height: 600,
    x_axis_type: null, y_axis_type: null,
    tools: [], toolbar_location: null,
  })

  function render(item: MonthlyShares) {
    fig.title = `${item.month} ${item.year}`

    const source = new Bokeh.ColumnDataSource({
      data: {
        names: item.browsers,
        shares: item.shares,
      },
    })

    const end_angles = cumsum(item.shares.map(to_radians))
    const start_angles = [0].concat(end_angles.slice(0, -1))
    const half_angles = zip(start_angles, end_angles).map(([start, end]) => (start + end)/2)
    const colors = item.browsers.map((name) => info[name].color)

    fig.wedge({x: 0, y: 0, radius: 1.5, source: source,
         start_angle: start_angles, end_angle: end_angles,
         line_color: "white", line_width: 1, fill_color: colors})

    const icons = item.browsers.map((name) => info[name].icon)
    const [x0, y0] = unzip(half_angles.map((angle) => to_cartesian(1.7, angle)))
    fig.image_url(icons, x0, y0, null, null, {source: source, anchor: "center"})

    const texts = item.shares.map((share) => {
      if (share <= 2.0)
        return null
      else
        return Bokeh.sprintf("%.02f%%", share)
    })
    const text_angles = item.shares.map((share, i) => {
      if (share <= 5.0)
        return half_angles[i]
      else
        return 0
    })
    const [x1, y1] = unzip(half_angles.map((angle) => to_cartesian(1.0, angle)))
    fig.text(x1, y1, texts, {source: source, angle: text_angles, text_align: "center", text_baseline: "middle"})
  }

  const tap = new Bokeh.TapTool({
    behavior: "inspect",
    callback: (ds) => {
      if (!paused) {
        const cds = ds as Bokeh.ColumnDataSource
        const i = cds.inspected['1d'].indices[0]
        const name = cds.data["names"][i]
        const share = Bokeh.sprintf("%.02f%%", cds.data["shares"][i])
        fig.title = `${name}: ${share}`
      }
      paused = !paused
    },
  })
  fig.add_tools(tap)

  let index = data.length-1
  let paused = false

  setInterval(() => {
    if (!paused) {
      fig.renderers = fig.renderers.filter((r) => !(r instanceof Bokeh.GlyphRenderer))
      render(data[index])
      if (--index < 0)
        index = data.length-1
    }
  }, 1000)

  plt.show(fig)
}
