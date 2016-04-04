module TappyScatter {
    import plt = Bokeh.Plotting;
    import _ = Bokeh._;

    Bokeh.set_log_level("info");
    Bokeh.logger.info(`Bokeh ${Bokeh.version}`);

    const N = 100
    const xx: Array<number> = []
    const yy: Array<number> = []

    for (let y = 0; y <= N; y += 4) {
        for (let x = 0; x <= N; x += 4) {
            xx.push(x)
            yy.push(y)
        }
    }

    const indices = _.range(N).map((i) => i.toString())
    const radii = _.range(N).map((i) => i*0.4 + 1.7)

    const colors: Array<string> = []
    for (let [r, g] of _.zip(xx.map((x) => 50 + 2*x), yy.map((y) => 30 + 2*y)))
        colors.push(plt.color(r, g, 150))

    const source = new Bokeh.ColumnDataSource({
        data: {x: xx, y: yy, radius: radii, colors: colors }
    })

    const tools = "pan,crosshair,pan,wheel_zoom,box_zoom,reset,tap,previewsave"

    const p = plt.figure({title: "Tappy Scatter", tools: tools})

    const circles = p.circle({field: "x"}, {field: "y"}, {source: source, radius: radii,
                             fill_color: colors, fill_alpha: 0.6, line_color: null})

    p.text({field: "x"}, {field: "y"}, indices, {source: source, alpha: 0.5,
           text_font_size: "5pt", text_baseline: "middle", text_align: "center"})

    const tap = p.tools.filter((t) => t instanceof Bokeh.TapTool)[0] as Bokeh.TapTool
    tap.renderers = [circles]

    plt.show(p)
}
