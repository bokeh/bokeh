
Collections = Bokeh.Collections

make_gmap_plot = (data_source, defaults, glyphspecs, {dims, tools, axes, legend, legend_name, plot_title, reference_point}) ->
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
  zoomtool = Collections('ZoomTool').create(
    dimensions: ['width', 'height']
  )
  plot_model.set_obj('tools', [pantool, zoomtool])

  return plot_model


xs = ( (x/50) for x in _.range(630) )
ys = (Math.sin(x) for x in xs)
colors = ("rgb(#{ Math.floor(155+100*val) }, #{ Math.floor(100+50*val) }, #{ Math.floor(150-50*val) })" for val in ys)
source = Collections('ColumnDataSource').create(
  data:
    x: xs
    y: ys
    fill: colors
)

opts = {dims: [800, 500], tools: true, axes: true, legend: false, plot_title: "GMap Plot"}
plot = make_gmap_plot(source, {}, [], opts)
Bokeh.Plotting.show(plot)




