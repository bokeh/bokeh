_ = require "underscore"
Solver = require "./solver"
Plot = require "./plot"

class GeoJSPlotView extends Plot.View

  initialize: (options) ->
    super(_.defaults(options, @default_options))
    @zoom_count = null

  bind_bokeh_events: () ->
    super()

    width = @frame.get('width')
    height = @frame.get('height')
    left = @canvas.vx_to_sx(@frame.get('left'))
    top = @canvas.vy_to_sy(@frame.get('top'))

    @canvas_view.map_div.attr("style",
      "top: #{top}px; left: #{left}px; position: absolute")
    @canvas_view.map_div.attr('style', "width:#{width}px;")
    @canvas_view.map_div.attr('style', "height:#{height}px;")
    @canvas_view.map_div.width("#{width}px").height("#{height}px")

    @initial_zoom = @mget('map_options').zoom

    build_map = () =>
      mo = @mget('map_options')
      map_options =
        center: [mo.lat, mo.lng]
        zoom: mo.zoom
        node: @canvas_view.map_div[0]

      @map = geo.map(map_options)
      @map.createLayer('osm')

    # Assuming that jquery is loaded already
    $.getScript("http://opengeoscience.github.io/geojs/lib/gl-matrix.js", ->
      $.getScript("http://opengeoscience.github.io/geojs/lib/d3.v3.min.js", ->
        $.getScript("http://opengeoscience.github.io/geojs/lib/proj4.js", ->
          $.getScript("http://opengeoscience.github.io/geojs/lib/vgl.js", ->
            $.getScript("http://opengeoscience.github.io/geojs/lib/geo.js", ->
              build_map()
            )
          )
        )
      )
    )

  _map_hook: (ctx, frame_box) ->
    [left, top, width, height] = frame_box

    @canvas_view.map_div.attr("style", "top: #{top}px; left: #{left}px;")
    @canvas_view.map_div.width("#{width}px").height("#{height}px")

  _paint_empty: (ctx, frame_box) ->
    ow = @canvas.get('width')
    oh = @canvas.get('height')
    [left, top, iw, ih] = frame_box

    ctx.clearRect(0, 0, ow, oh)

    ctx.beginPath()
    ctx.moveTo(0,  0)
    ctx.lineTo(0,  oh)
    ctx.lineTo(ow, oh)
    ctx.lineTo(ow, 0)
    ctx.lineTo(0,  0)

    ctx.moveTo(left,    top)
    ctx.lineTo(left+iw, top)
    ctx.lineTo(left+iw, top+ih)
    ctx.lineTo(left,    top+ih)
    ctx.lineTo(left,    top)
    ctx.closePath()

    ctx.fillStyle = @mget('border_fill')
    ctx.fill()

class GeoJSPlot extends Plot.Model
  type: 'GeoJSPlot'
  default_view: GeoJSPlotView

  initialize: (attrs, options) ->
    @use_map = true
    super(attrs, options)

  parent_properties: [
    'border_fill',
    'min_border',
    'min_border_top',
    'min_border_bottom'
    'min_border_left'
    'min_border_right'
  ]

  defaults: ->
    return _.extend {}, super(), {
      title: 'GeoJSPlot'
    }

  display_defaults: ->
    return _.extend {}, super(), {
      border_fill: "#fff",
    }

module.exports =
  Model: GeoJSPlot
  View: GeoJSPlotView
