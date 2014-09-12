
define [
  "underscore",
  "backbone",
  "./solver",
  "./plot",
], (_, Backbone, Solver, Plot) ->

  class GMapPlotView extends Plot.View

    initialize: (options) ->
      super(_.defaults(options, @default_options))
      @zoom_count = null

    update_range: (range_info) ->
      if not range_info?
        range_info = @initial_range_info
      @pause()
      if range_info.sdx?
        @map.panBy(range_info.sdx, range_info.sdy)
      else
        xr = range_info.xrs.default
        yr = range_info.yrs.default
        sw_lng = Math.min(xr.start, xr.end)
        ne_lng = Math.max(xr.start, xr.end)
        sw_lat = Math.min(yr.start, yr.end)
        ne_lat = Math.max(yr.start, yr.end)

        center = new google.maps.LatLng((ne_lat+sw_lat)/2, (ne_lng+sw_lng)/2)

        if not range_info.factor?
          @map.setCenter(center)
          @map.setZoom(@initial_zoom)
        else if range_info.factor > 0
          @zoom_count += 1
          if @zoom_count == 10
            @map.setZoom(@map.getZoom()+1)
            @zoom_count = 0
        else
          @zoom_count -= 1
          if @zoom_count == -10
            @map.setCenter(center)
            @map.setZoom(@map.getZoom()-1)
            @map.setCenter(center)
            @zoom_count = 0

      @unpause()

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
        map_types = {
          "satellite": google.maps.MapTypeId.SATELLITE,
          "terrain": google.maps.MapTypeId.TERRAIN,
          "roadmap": google.maps.MapTypeId.ROADMAP,
          "hybrid": google.maps.MapTypeId.HYBRID
        }
        mo = @mget('map_options')
        map_options =
          center: new google.maps.LatLng(mo.lat, mo.lng)
          zoom:mo.zoom
          disableDefaultUI: true
          mapTypeId: map_types[mo.map_type]

        # Create the map with above options in div
        @map = new google.maps.Map(@canvas_view.map_div[0], map_options)
        google.maps.event.addListener(@map, 'bounds_changed', @bounds_change)

      if window.google? and window.google.maps?
        _.defer(build_map)
      else
        window['_bokeh_first_gmap_load'] = build_map
        script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = 'https://maps.googleapis.com/maps/api/js?v=3.exp&sensor=false&callback=_bokeh_first_gmap_load';
        document.body.appendChild(script);

    bounds_change: () =>
      bds = @map.getBounds()
      ne = bds.getNorthEast()
      sw = bds.getSouthWest()
      @x_range.set({start: sw.lng(), end: ne.lng(), silent:true})
      @y_range.set({start: sw.lat(), end: ne.lat(), silent:true})
      if not @initial_range_info?
        @initial_range_info = {
          xr: { start: @x_range.get('start'), end: @x_range.get('end') }
          yr: { start: @y_range.get('start'), end: @y_range.get('end') }
        }
      @render()

    _map_hook: (ctx, frame_box) ->
      [left, top, width, height] = frame_box

      @canvas_view.map_div.attr("style", "top: #{top}px; left: #{left}px;")
      @canvas_view.map_div.width("#{width}px").height("#{width}px")

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

    defaults: () ->
      return _.extend(super(), {
        title: 'GMapPlot'
      })

    display_defaults: () ->
      return _.extend(super(), {
        border_fill: "#eee",
      })

  class GMapPlots extends Backbone.Collection
     model: GMapPlot

  return {
    "Model": GMapPlot,
    "Collection": new GMapPlots(),
    "View": GMapPlotView,
  }
