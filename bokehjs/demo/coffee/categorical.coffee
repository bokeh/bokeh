
require(['main'], (Bokeh) ->



  r = new Bokeh.Random(123456789)

  factors = ["foo", "bar", "baz"]

  data = {
    x: [50, 40, 65]
    y: ["foo", "bar", "baz"]
  }

  glyph = {
    type: 'circle'
    x: 'x'
    y: 'y'
    radius: 6
    radius_units: 'screen'
    fill_color: 'green'
    fill_alpha: 0.6
    line_color: 'green'
  }

  options = {
    title: "Categorical Demo"
    dims: [600, 600]
    xrange: [0, 100]
    yrange: factors
    xaxes: "min"
    yaxes: "min"
    tools: false
    legend: false
  }

  plot = Bokeh.Plotting.make_plot(glyph, data, options)
  Bokeh.Plotting.show(plot)
  )
