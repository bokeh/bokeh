_ = require "underscore"
Solver = require "./solver"
Plot = require "./plot"
proj4 = require "proj4"

class GMapPlotView extends Plot.View

  initialize: (options) ->
    super(_.defaults(options, @default_options))
    @zoom_count = 0

  getBokehBounds: () =>
    bounds = @map.getBounds()
    top_right = bounds.getNorthEast()
    bottom_left = bounds.getSouthWest()

    xstart = bottom_left.lng()
    xend = top_right.lng()
    ystart = bottom_left.lat()
    yend = top_right.lat()
    return [xstart, xend, ystart, yend]

  recenter: () =>
    # Set the range and ensure map is positioned at center of range
    [xstart, xend, ystart, yend] = @getBokehBounds()
    @x_range.set({start: xstart, end: xend, silent:true})
    @y_range.set({start: ystart, end: yend, silent:true})
    center = new google.maps.LatLng( ( ystart + yend ) / 2, ( xstart + xend ) / 2)
    @map.panTo(center)

  update_range: (range_info) ->

    # PAN ----------------------------
    if range_info.sdx? or range_info.sdy?
      @map.panBy(range_info.sdx, range_info.sdy)
      super(range_info)
    # END PAN ------------------------

    # ZOOM ---------------------------
    if range_info.factor?

      # The zoom count decreases the sensitivity of the zoom. (We could make this user configurable)
      if @zoom_count != 10
        @zoom_count += 1
        return
      @zoom_count = 0

      super(range_info)

      if range_info.factor < 0 
        zoom_change = -1
      else
        zoom_change = 1

      original_map_zoom = @map.getZoom()
      new_map_zoom = original_map_zoom + zoom_change

      @map.setZoom(new_map_zoom)
      
      # Check we haven't gone out of bounds, and if we have undo the zoom
      [xstart, xend, ystart, yend] = @getBokehBounds()
      if ( xend - xstart ) < 0
        @map.setZoom(original_map_zoom)

      # Finally re-center
      @recenter()
    # END ZOOM ---------------------

  bind_bokeh_events: () ->
    super()

    width = @frame.get('width')
    height = @frame.get('height')
    left = @canvas.vx_to_sx(@frame.get('left'))
    top = @canvas.vy_to_sy(@frame.get('top'))

    @canvas_view.map_div.attr("style", "top: #{top}px; left: #{left}px; position: absolute")
    @canvas_view.map_div.attr('style', "width:#{width}px;")
    @canvas_view.map_div.attr('style', "height:#{height}px;")
    @canvas_view.map_div.width("#{width}px").height("#{height}px")

    @initial_zoom = @mget('map_options').zoom

    build_map = () =>
      maps = window.google.maps
      map_types = {
        "satellite": maps.MapTypeId.SATELLITE,
        "terrain": maps.MapTypeId.TERRAIN,
        "roadmap": maps.MapTypeId.ROADMAP,
        "hybrid": maps.MapTypeId.HYBRID
      }
      mo = @mget('map_options')
      map_options =
        center: new maps.LatLng(mo.lat, mo.lng)
        zoom:mo.zoom
        disableDefaultUI: true
        mapTypeId: map_types[mo.map_type]

      if mo.styles?
        map_options.styles = JSON.parse(mo.styles)

      # Create the map with above options in div
      @map = new maps.Map(@canvas_view.map_div[0], map_options)
      maps.event.addListenerOnce(@map, 'idle', @recenter)

    if not window._bokeh_gmap_loads?
      window._bokeh_gmap_loads = []

    if window.google? and window.google.maps?
      _.defer(build_map)

    else if window._bokeh_gmap_callback?
      window._bokeh_gmap_loads.push(build_map)

    else
      window._bokeh_gmap_loads.push(build_map)
      window._bokeh_gmap_callback = () ->
        _.each(window._bokeh_gmap_loads, _.defer)
      script = document.createElement('script')
      script.type = 'text/javascript'
      script.src = "https://maps.googleapis.com/maps/api/js?v=3&callback=_bokeh_gmap_callback"
      document.body.appendChild(script)

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

class GMapPlot extends Plot.Model
  type: 'GMapPlot'
  default_view: GMapPlotView

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
      title: 'GMapPlot'
    }

  display_defaults: ->
    return _.extend {}, super(), {
      border_fill: "#fff",
    }

module.exports =
  Model: GMapPlot
  View: GMapPlotView
