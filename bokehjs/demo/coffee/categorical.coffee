
require(['main'], (Bokeh) ->

  factors = ["foo", "bar", "baz"]

  data = {
    x: ["foo", "foo", "foo", "bar", "bar", "bar", "baz", "baz", "baz"]
    y: ["foo", "bar", "baz", "foo", "bar", "baz", "foo", "bar", "baz"]
    colors: ["#0B486B", "#79BD9A", "#CFF09E", "#79BD9A", "#0B486B", "#79BD9A", "#CFF09E", "#79BD9A", "#0B486B"]
  }

  square = {
    type: 'Square'
    source: "data"
    x: 'x'
    y: 'y'
    size: 165
    fill_color: 'colors'
    line_color: 'colors'
  }

  xaxis = {
    type: "auto"
    location: "below"
    grid: false
  }

  yaxis = {
    type: "auto"
    location: "left"
    grid: false
  }

  options = {
    title: "Categorical Heatmap Demo"
    plot_width: 600
    plot_height: 600
    x_range: factors
    y_range: factors
  }

  $("#target").bokeh("figure", {
    options: options
    sources: { data: data }
    glyphs: [square]
    guides: [xaxis, yaxis]
    tools: ["Pan", "WheelZoom" ,"Resize" ,"PreviewSave"]
  })

)


