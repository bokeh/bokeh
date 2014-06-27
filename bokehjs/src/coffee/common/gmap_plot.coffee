
define [
  "underscore",
  "jquery",
  "backbone",
  "./build_views",
  "./safebind",
  "./plot_utils",
  "./continuum_view",
  "./has_parent",
  "./view_state",
  "mapper/1d/linear_mapper",
  "mapper/2d/grid_mapper",
  "renderer/properties",
  "tool/active_tool_manager",
], (_, $, Backbone, build_views, safebind, plot_utils, ContinuumView, HasParent, ViewState, LinearMapper, GridMapper, Properties, ActiveToolManager) ->

  class GMapPlotView extends ContinuumView.View

    view_options: () ->
      _.extend({plot_model: @model, plot_view: @}, @options)

    pause: () ->
      @is_paused = true

    unpause: () ->
      @is_paused = false
      @request_render()

    request_render: () ->
      if not @is_paused
        @throttled_render()
      return

    initialize: (options) ->
      super(_.defaults(options, @default_options))

      @canvas = @mget_obj('canvas')
      @canvas_view = new @canvas.default_view({'model': @canvas})
      @$el.append(@canvas_view.$el)

      # TODO (bryanv) investigate (turn off?) throttling for gmap plots
      @throttled_render = _.throttle(@render, 100)
      @throttled_render_canvas = _.throttle(@canvas_view.render, 100)

      @outline_props = new Properties.line_properties(@, {}, 'outline_')
      @title_props = new Properties.text_properties(@, {}, 'title_')

      @view_state = new ViewState({
        canvas_width:      @canvas.get('canvas_width')
        canvas_height:     @canvas.get('canvas_height')
        outer_width:       @canvas.get('canvas_width')
        outer_height:      @canvas.get('canvas_height')
        x_offset:          0
        y_offset:          0
        min_border_top:    (options.min_border_top    ? @mget('min_border_top'))    ? @mget('min_border')
        min_border_bottom: (options.min_border_bottom ? @mget('min_border_bottom')) ? @mget('min_border')
        min_border_left:   (options.min_border_left   ? @mget('min_border_left'))   ? @mget('min_border')
        min_border_right:  (options.min_border_right  ? @mget('min_border_right'))  ? @mget('min_border')
        requested_border_top: 0
        requested_border_bottom: 0
        requested_border_left: 0
        requested_border_right: 0
      })

      @x_range = options.x_range ? @mget_obj('x_range')
      @y_range = options.y_range ? @mget_obj('y_range')
      @xmapper = new LinearMapper.Model({
        source_range: @x_range
        target_range: @view_state.get('inner_range_horizontal')
      })

      @ymapper = new LinearMapper.Model({
        source_range: @y_range
        target_range: @view_state.get('inner_range_vertical')
      })

      @mapper = new GridMapper.Model({
        domain_mapper: @xmapper
        codomain_mapper: @ymapper
      })
      for tool in @mget_obj('tools')
        if tool.type == "PanTool" or tool.type == "WheelZoomTool"
          tool.set_obj('dataranges', [@x_range, @y_range])
          tool.set('dimensions', ['width', 'height'])

      @requested_padding = {
        top: 0
        bottom: 0
        left: 0
        right: 0
      }

      @old_mapper_state = {
        x: null
        y: null
      }

      @am_rendering = false

      @renderers = {}
      @tools = {}
      @zoom_count = null

      @eventSink = _.extend({}, Backbone.Events)
      @canvas_view.render()
      @atm = new ActiveToolManager(@eventSink)
      @levels = {}
      for level in plot_utils.LEVELS
        @levels[level] = {}
      @build_levels()
      @request_render()
      @atm.bind_bokeh_events()
      @bind_bokeh_events()
      return this

    map_to_screen: (x, x_units, y, y_units, units) ->
      if x_units == 'screen'
        sx = x[..]
        sy = y[..]
      else
        [sx, sy] = @mapper.v_map_to_target(x, y)

      sx = @view_state.v_vx_to_sx(sx)
      sy = @view_state.v_vy_to_sy(sy)

      return [sx, sy]

    map_from_screen: (sx, sy, units) ->
      sx = @view_state.v_sx_to_vx(sx[..])
      sy = @view_state.v_sy_to_vy(sy[..])

      if units == 'screen'
        x = sx
        y = sy
      else
        [x, y] = @mapper.v_map_from_target(sx, sy)  # TODO: in-place?

      return [x, y]

    update_range: (range_info) ->
      if not range_info?
        range_info = @initial_range_info
      @pause()
      if range_info.sdx?
        @map.panBy(range_info.sdx, range_info.sdy)
      else
        sw_lng = Math.min(range_info.xr.start, range_info.xr.end)
        ne_lng = Math.max(range_info.xr.start, range_info.xr.end)
        sw_lat = Math.min(range_info.yr.start, range_info.yr.end)
        ne_lat = Math.max(range_info.yr.start, range_info.yr.end)

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

    build_tools: () ->
      return build_views(@tools, @mget_obj('tools'), @view_options())

    build_views: ()->
      return build_views(@renderers, @mget_obj('renderers'), @view_options())

    build_levels: () ->
      # need to separate renderer/tool creation from event binding
      # because things like box selection overlay needs to bind events
      # on the select tool
      #
      # should only bind events on NEW views and tools
      views = @build_views()
      tools = @build_tools()
      for v in views
        level = v.mget('level')
        @levels[level][v.model.id] = v
        v.bind_bokeh_events()
      for t in tools
        level = t.mget('level')
        @levels[level][t.model.id] = t
        t.bind_bokeh_events()
      return this

    bind_bokeh_events: () ->
      safebind(this, @x_range, 'change', @request_render)
      safebind(this, @y_range, 'change', @request_render)
      safebind(this, @model, 'change:renderers', @build_levels)
      safebind(this, @model, 'change:tool', @build_levels)
      safebind(this, @model, 'change', @request_render)
      safebind(this, @model, 'destroy', () => @remove())

      iw = @view_state.get('inner_width')
      ih = @view_state.get('inner_height')
      top = @view_state.get('border_top')
      left = @view_state.get('border_left')

      @canvas_view.map_div.attr("style", "top: #{top}px; left: #{left}px; position: absolute")
      @canvas_view.map_div.attr('style', "width:#{iw}px;")
      @canvas_view.map_div.attr('style', "height:#{ih}px;")
      @canvas_view.map_div.width("#{iw}px").height("#{ih}px")
      @initial_zoom = @mget('map_options').zoom

      build_map = () =>
        mo = @mget('map_options')
        map_options =
          center: new google.maps.LatLng(mo.lat, mo.lng)
          zoom:mo.zoom
          disableDefaultUI: true
          mapTypeId: google.maps.MapTypeId.SATELLITE

        # Create the map with above options in div
        @map = new google.maps.Map(@canvas_view.map_div[0], map_options)
        google.maps.event.addListener(@map, 'bounds_changed', @bounds_change)

      if window.google? and window.google.maps?
        _.defer(@build_map)
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
      @y_range.set({start: sw.lat(), end: ne.lat()})
      if not @initial_range_info?
        @initial_range_info = {
          xr: { start: @x_range.get('start'), end: @x_range.get('end') }
          yr: { start: @y_range.get('start'), end: @y_range.get('end') }
        }

    render: (force) ->
      ctx = @canvas_view.ctx

      @requested_padding = {
        top: 0
        bottom: 0
        left: 0
        right: 0
      }

      for level in ['image', 'underlay', 'glyph', 'overlay', 'annotation', 'tool']
        renderers = @levels[level]
        for k, v of renderers
          if v.padding_request?
            pr = v.padding_request()
            for k, v of pr
              @requested_padding[k] += v

      title = @mget('title')
      if title
        @title_props.set(ctx, {})
        th = ctx.measureText(@mget('title')).ascent
        @requested_padding['top'] += (th + @mget('title_standoff'))

      sym = @mget('border_symmetry') or ""
      if sym.indexOf('h') >= 0 or sym.indexOf('H') >= 0
        hpadding = Math.max(@requested_padding['left'], @requested_padding['right'])
        @requested_padding['left'] = hpadding
        @requested_padding['right'] = hpadding
      if sym.indexOf('v') >= 0 or sym.indexOf('V') >= 0
        hpadding = Math.max(@requested_padding['top'], @requested_padding['bottom'])
        @requested_padding['top'] = hpadding
        @requested_padding['bottom'] = hpadding

      @is_paused = true
      for k, v of @requested_padding
        @view_state.set("requested_border_#{k}", v)
      @is_paused = false

      oh = @view_state.get('outer_height')
      ow = @view_state.get('outer_width')
      iw = @view_state.get('inner_width')
      ih = @view_state.get('inner_height')
      top = @view_state.get('border_top')
      left = @view_state.get('border_left')

      @canvas_view.map_div.attr("style", "top: #{top}px; left: #{left}px;")
      @canvas_view.map_div.width("#{iw}px").height("#{ih}px")

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

      if @outline_props.do_stroke
        @outline_props.set(ctx, {})
        ctx.strokeRect(
          @view_state.get('border_left'), @view_state.get('border_top'),
          @view_state.get('inner_width'), @view_state.get('inner_height'),
        )

      have_new_mapper_state = false
      xms = @xmapper.get('mapper_state')[0]
      yms = @xmapper.get('mapper_state')[0]
      if Math.abs(@old_mapper_state.x-xms) > 1e-8 or Math.abs(@old_mapper_state.y - yms) > 1e-8
        @old_mapper_state.x = xms
        @old_mapper_state.y = yms
        have_new_mapper_state = true

      ctx.save()

      ctx.beginPath()
      ctx.rect(
        @view_state.get('border_left'), @view_state.get('border_top'),
        @view_state.get('inner_width'), @view_state.get('inner_height'),
      )
      ctx.clip()
      ctx.beginPath()

      for level in ['image', 'underlay', 'glyph']
        renderers = @levels[level]
        for k, v of renderers
          v.render(have_new_mapper_state)

      ctx.restore()

      for level in ['overlay', 'annotation', 'tool']
        renderers = @levels[level]
        for k, v of renderers
          v.render(have_new_mapper_state)

      if title
        sx = @view_state.get('outer_width')/2
        sy = th
        @title_props.set(ctx, {})
        ctx.fillText(title, sx, sy)

  class GMapPlot extends HasParent
    type: 'GMapPlot'
    default_view: GMapPlotView

    add_renderers: (new_renderers) ->
      renderers = @get('renderers')
      renderers = renderers.concat(new_renderers)
      @set('renderers', renderers)

    parent_properties: [
      'border_fill',
      'canvas_width',
      'canvas_height',
      'outer_width',
      'outer_height',
      'min_border',
      'min_border_top',
      'min_border_bottom'
      'min_border_left'
      'min_border_right'
    ]


    defaults: () ->
      return {
      data_sources: {},
      renderers: [],
      tools: [],
      title: 'GMapPlot',
      }

    display_defaults: () ->
      return {
        hidpi: true,
        border_fill: "#eee",
        border_symmetry: 'h',
        min_border: 40,

        title_standoff: 8,
        title_text_font: "helvetica",
        title_text_font_size: "20pt",
        title_text_font_style: "normal",
        title_text_color: "#444444",
        title_text_alpha: 1.0,
        title_text_align: "center",
        title_text_baseline: "alphabetic"

        outline_line_color: '#aaaaaa'
        outline_line_width: 1
        outline_line_alpha: 1.0
        outline_line_join: 'miter'
        outline_line_cap: 'butt'
        outline_line_dash: []
        outline_line_dash_offset: 0

      }

  class GMapPlots extends Backbone.Collection
     model: GMapPlot

  return {
    "Model": GMapPlot,
    "Collection": new GMapPlots(),
    "View": GMapPlotView,
  }

