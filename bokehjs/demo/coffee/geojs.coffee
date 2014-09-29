
Collections = Bokeh.Collections

make_geojs_plot = (defaults, glyphspecs, {dims, tools, axes, legend, legend_name, plot_title, reference_point}) ->
  dims ?= [400, 400]
  tools ?= true
  axes ?= true
  legend ?= true
  legend_name ?= "glyph"
  plot_title ?= ""

  xdr = Collections('Range1d').create()
  ydr = Collections('Range1d').create()

  plot = Collections('GeoJSPlot').create(
    map_options:
      lat: 30.267153
      lng: -97.74306079999997
      zoom: 15
    x_range: xdr
    y_range: ydr
    plot_width: dims[0]
    plot_height: dims[1]
    title: plot_title
  )
  plot.set(defaults)

  xaxis = Collections('LinearAxis').create(
    axis_label: 'x'
    plot: plot
  )
  below = plot.get('below')
  below.push(xaxis)
  plot.set('below', below)

  yaxis = Collections('LinearAxis').create(
    axis_label: 'y'
    plot: plot
  )
  left = plot.get('left')
  left.push(yaxis)
  plot.set('left', left)

  plot.add_renderers(
    [xaxis, yaxis]
  )

  pantool = Collections('PanTool').create(
    dimensions: ['width', 'height']
  )
  wheelzoomtool = Collections('WheelZoomTool').create(
    dimensions: ['width', 'height']
  )
  resettool = Collections('ResetTool').create()
  plot.set_obj('tools', [pantool, wheelzoomtool, resettool])

  return plot


opts = {dims: [800, 800], tools: true, axes: true, legend: false, plot_title: "GMap Plot"}
plot = make_geojs_plot({}, [], opts)
Bokeh.Plotting.show(plot)




