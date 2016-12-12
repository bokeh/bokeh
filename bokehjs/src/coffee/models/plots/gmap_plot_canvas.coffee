import * as _ from "underscore"
import {proj4, mercator} from "../../core/util/proj4"

import {PlotCanvas, PlotCanvasView} from "./plot_canvas"
import * as p from "../../core/properties"

export class GMapPlotCanvasView extends PlotCanvasView

  initialize: (options) ->
    super(options)
    @zoom_count = 0

  getLatLngBounds: () =>
    bounds = @map.getBounds()
    top_right = bounds.getNorthEast()
    bottom_left = bounds.getSouthWest()

    xstart = bottom_left.lng()
    xend = top_right.lng()
    ystart = bottom_left.lat()
    yend = top_right.lat()
    return [xstart, xend, ystart, yend]

  getProjectedBounds: () =>
    [xstart, xend, ystart, yend] = @getLatLngBounds()
    [proj_xstart, proj_ystart] = proj4(mercator, [xstart, ystart])
    [proj_xend, proj_yend] = proj4(mercator, [xend, yend])
    return [proj_xstart, proj_xend, proj_ystart, proj_yend]

  setRanges: () =>
    [proj_xstart, proj_xend, proj_ystart, proj_yend] = @getProjectedBounds()
    @x_range.setv({start: proj_xstart, end: proj_xend})
    @y_range.setv({start: proj_ystart, end: proj_yend})

  update_range: (range_info) ->
    @pause()
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

      # Zooming out too far causes problems
      if new_map_zoom >=2
        @map.setZoom(new_map_zoom)

        # Check we haven't gone out of bounds, and if we have undo the zoom
        [proj_xstart, proj_xend, proj_ystart, proj_yend] = @getProjectedBounds()
        if ( proj_xend - proj_xstart ) < 0
          @map.setZoom(original_map_zoom)

      # Finally re-center
      @setRanges()
    # END ZOOM ---------------------
    @unpause()

  bind_bokeh_events: () ->
    super()

    width = @frame.width
    height = @frame.height
    left = @canvas.vx_to_sx(@frame.left)
    top = @canvas.vy_to_sy(@frame.top)

    @canvas_view.map_div.attr("style", "top: #{top}px; left: #{left}px; position: absolute")
    @canvas_view.map_div.attr('style', "width:#{width}px;")
    @canvas_view.map_div.attr('style', "height:#{height}px;")
    @canvas_view.map_div.width("#{width}px").height("#{height}px")

    @initial_zoom = @model.plot.map_options.zoom

    build_map = () =>
      maps = window.google.maps
      map_types = {
        "satellite": maps.MapTypeId.SATELLITE,
        "terrain": maps.MapTypeId.TERRAIN,
        "roadmap": maps.MapTypeId.ROADMAP,
        "hybrid": maps.MapTypeId.HYBRID
      }
      mo = @model.plot.map_options
      map_options =
        center: new maps.LatLng(mo.lat, mo.lng)
        zoom:mo.zoom
        disableDefaultUI: true
        mapTypeId: map_types[mo.map_type]

      if mo.styles?
        map_options.styles = JSON.parse(mo.styles)

      # Create the map with above options in div
      @map = new maps.Map(@canvas_view.map_div[0], map_options)
      maps.event.addListenerOnce(@map, 'idle', @setRanges)

    if not window._bokeh_gmap_loads?
      window._bokeh_gmap_loads = []

    if window.google? and window.google.maps?
      _.defer(build_map)

    else if window._bokeh_gmap_callback?
      window._bokeh_gmap_loads.push(build_map)

    else
      window._bokeh_gmap_loads.push(build_map)
      window._bokeh_gmap_callback = () -> window._bokeh_gmap_loads.forEach(_.defer)
      script = document.createElement('script')
      script.type = 'text/javascript'
      script.src = "https://maps.googleapis.com/maps/api/js?key=#{@model.plot.api_key}&callback=_bokeh_gmap_callback"
      document.body.appendChild(script)

  _map_hook: (ctx, frame_box) ->
    [left, top, width, height] = frame_box

    @canvas_view.map_div.attr("style", "top: #{top}px; left: #{left}px;")
    @canvas_view.map_div.width("#{width}px").height("#{height}px")

  _paint_empty: (ctx, frame_box) ->
    ow = @canvas.width
    oh = @canvas.height
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

    ctx.fillStyle = @model.plot.border_fill_color
    ctx.fill()

export class GMapPlotCanvas extends PlotCanvas
  type: 'GMapPlotCanvas'
  default_view: GMapPlotCanvasView


  initialize: (attrs, options) ->
    @use_map = true
    super(attrs, options)
