import {proj4, mercator} from "core/util/proj4"

import {PlotCanvas, PlotCanvasView} from "./plot_canvas"
import * as p from "core/properties"
import {defer} from "core/util/callback"

load_google_api = (callback, api_key) ->
  if not window.google?.maps?
    window._bokeh_gmap_callback = () -> callback()
    script = document.createElement('script')
    script.type = 'text/javascript'
    script.src = "https://maps.googleapis.com/maps/api/js?key=#{api_key}&callback=_bokeh_gmap_callback"
    document.body.appendChild(script)

export class GMapPlotCanvasView extends PlotCanvasView

  initialize: (options) ->
    super(options)
    @zoom_count = 0

    mo = @model.plot.map_options
    @initial_zoom = mo.zoom
    @initial_lat = mo.lat
    @initial_lng = mo.lng

    @canvas_view.map_div.style.position = "absolute"

    load_google_api(@request_render, @model.plot.api_key)

  update_range: (range_info) ->
    # RESET -------------------------
    if not range_info?
      mo = @model.plot.map_options
      @map.setCenter({lat: @initial_lat, lng: @initial_lng});
      @map.setOptions({zoom: @initial_zoom})
      super(null)

    # PAN ----------------------------
    else if range_info.sdx? or range_info.sdy?
      @map.panBy(range_info.sdx, range_info.sdy)
      super(range_info)

    # ZOOM ---------------------------
    else if range_info.factor?
      @pause()

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

      old_map_zoom = @map.getZoom()
      new_map_zoom = old_map_zoom + zoom_change

      # Zooming out too far causes problems
      if new_map_zoom >=2
        @map.setZoom(new_map_zoom)

        # Check we haven't gone out of bounds, and if we have undo the zoom
        [proj_xstart, proj_xend, proj_ystart, proj_yend] = @_get_projected_bounds()
        if ( proj_xend - proj_xstart ) < 0
          @map.setZoom(old_map_zoom)

      @unpause()

    # Finally re-center
    @_set_bokeh_ranges()

  _build_map: () ->
    maps = window.google.maps

    @map_types = {
      satellite : maps.MapTypeId.SATELLITE,
      terrain   : maps.MapTypeId.TERRAIN,
      roadmap   : maps.MapTypeId.ROADMAP,
      hybrid    : maps.MapTypeId.HYBRID
    }

    mo = @model.plot.map_options
    map_options = {
      center: new maps.LatLng(mo.lat, mo.lng)
      zoom:mo.zoom
      disableDefaultUI: true
      mapTypeId: @map_types[mo.map_type]
      scaleControl: mo.scale_control
    }

    if mo.styles?
      map_options.styles = JSON.parse(mo.styles)

    # create the map with above options in div
    @map = new maps.Map(@canvas_view.map_div, map_options)

    # update bokeh ranges whenever the map idles, which should be after any UI action
    maps.event.addListenerOnce(@map, 'idle', @_set_bokeh_ranges)

    # wire up listeners so that changes to properties are reflected
    @listenTo(@model.plot, 'change:map_options', () => @_update_options())
    @listenTo(@model.plot.map_options, 'change:styles', () => @_update_styles())
    @listenTo(@model.plot.map_options, 'change:lat', () => @_update_center('lat'))
    @listenTo(@model.plot.map_options, 'change:lng', () => @_update_center('lng'))
    @listenTo(@model.plot.map_options, 'change:zoom', () => @_update_zoom())
    @listenTo(@model.plot.map_options, 'change:map_type', () => @_update_map_type())
    @listenTo(@model.plot.map_options, 'change:scale_control', () => @_update_scale_control())

  _get_latlon_bounds: () =>
    bounds = @map.getBounds()
    top_right = bounds.getNorthEast()
    bottom_left = bounds.getSouthWest()

    xstart = bottom_left.lng()
    xend = top_right.lng()
    ystart = bottom_left.lat()
    yend = top_right.lat()
    return [xstart, xend, ystart, yend]

  _get_projected_bounds: () =>
    [xstart, xend, ystart, yend] = @_get_latlon_bounds()
    [proj_xstart, proj_ystart] = proj4(mercator, [xstart, ystart])
    [proj_xend, proj_yend] = proj4(mercator, [xend, yend])
    return [proj_xstart, proj_xend, proj_ystart, proj_yend]

  _set_bokeh_ranges: () =>
    [proj_xstart, proj_xend, proj_ystart, proj_yend] = @_get_projected_bounds()
    @x_range.setv({start: proj_xstart, end: proj_xend})
    @y_range.setv({start: proj_ystart, end: proj_yend})

  _update_center: (fld) ->
    c = @map.getCenter().toJSON()
    c[fld] = @model.plot.map_options[fld]
    @map.setCenter(c)
    @_set_bokeh_ranges()

  _update_map_type: () ->
    maps = window.google.maps
    @map.setOptions({mapTypeId: @map_types[@model.plot.map_options.map_type] })

  _update_scale_control: () ->
    maps = window.google.maps
    @map.setOptions({scaleControl: @model.plot.map_options.scale_control })

  _update_options: () ->
    @_update_styles()
    @_update_center('lat')
    @_update_center('lng')
    @_update_zoom()
    @_update_map_type()

  _update_styles: () ->
    @map.setOptions({styles: JSON.parse(@model.plot.map_options.styles) })

  _update_zoom: () ->
    @map.setOptions({zoom: @model.plot.map_options.zoom})
    @_set_bokeh_ranges()

  # this method is expected and called by PlotView.render
  _map_hook: (ctx, frame_box) ->
    [left, top, width, height] = frame_box
    @canvas_view.map_div.style.top    = "#{top}px"
    @canvas_view.map_div.style.left   = "#{left}px"
    @canvas_view.map_div.style.width  = "#{width}px"
    @canvas_view.map_div.style.height = "#{height}px"

    if not @map?
      @_build_map()

  # this overrides the standard _paint_empty to make the inner canvas transparent
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
