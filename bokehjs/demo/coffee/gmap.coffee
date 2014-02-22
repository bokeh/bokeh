
Collections = Bokeh.Collections

make_gmap_plot = (defaults, glyphspecs, {dims, tools, axes, legend, legend_name, plot_title, reference_point}) ->
  dims ?= [400, 400]
  tools ?= true
  axes ?= true
  legend ?= true
  legend_name ?= "glyph"
  plot_title ?= ""

  xdr = Collections('Range1d').create()
  ydr = Collections('Range1d').create()

  plot_model = Collections('GMapPlot').create(
    map_options:
      lat: 30.267153
      lng: -97.74306079999997
      zoom: 15
    x_range: xdr.ref()
    y_range: ydr.ref()
    canvas_width: dims[0]
    canvas_height: dims[1]
    outer_width: dims[0]
    outer_height: dims[1]
    title: plot_title
  )
  plot_model.set(defaults)

  xaxis = Collections('LinearAxis').create(
    dimension: 0
    axis_label: 'x'
    plot: plot_model.ref()
  )
  yaxis = Collections('LinearAxis').create(
    dimension: 1
    axis_label: 'y'
    plot: plot_model.ref()
  )

  plot_model.add_renderers(
    [xaxis.ref(), yaxis.ref()]
  )

  pantool = Collections('PanTool').create(
    dimensions: ['width', 'height']
  )
  wheelzoomtool = Collections('WheelZoomTool').create(
    dimensions: ['width', 'height']
  )
  resettool = Collections('ResetTool').create()
  plot_model.set_obj('tools', [pantool, wheelzoomtool, resettool])

  return plot_model


opts = {dims: [800, 800], tools: true, axes: true, legend: false, plot_title: "GMap Plot"}
plot = make_gmap_plot({}, [], opts)
Bokeh.Plotting.show(plot)




