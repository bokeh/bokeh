
define [
  "underscore",
  "backbone",
  "require",
  "./build_views",
  "./safebind",
  "./bulk_save",
  "./continuum_view",
  "./has_parent",
  "./view_state",
  "mapper/1d/linear_mapper",
  "mapper/1d/categorical_mapper",
  "mapper/2d/grid_mapper",
  "renderer/properties",
  "tool/active_tool_manager",
  "util/object_explorer",
], (_, Backbone, require, build_views, safebind, bulk_save, ContinuumView, HasParent, ViewState, LinearMapper, CategoricalMapper, GridMapper, Properties, ActiveToolManager, ObjectExplorer) ->

  line_properties = Properties.line_properties
  text_properties = Properties.text_properties

  LEVELS = ['image', 'underlay', 'glyph', 'overlay', 'annotation', 'tool']

  delay_animation = (f) ->
    return f()

  delay_animation = window.requestAnimationFrame ||
          window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame ||
          window.msRequestAnimationFrame || delay_animation

  # Returns a function, that, when invoked, will only be triggered at
  # most once during a given window of time.  If the browser supports
  # requestAnimationFrame, in addition the throttled function will be run
  # no more frequently than request animation frame allow
  throttle_animation = (func, wait) ->
    [context , args, timeout, result] = [null,null,null,null]
    previous = 0
    pending = false
    later = ->
      previous = new Date
      timeout = null
      pending = false
      result = func.apply(context, args)

    return ->
      now = new Date
      remaining = wait - (now - previous)
      context = this
      args = arguments
      if (remaining <= 0 and !pending)
        clearTimeout(timeout)
        pending = true
        delay_animation(later)
      else if (!timeout)
        timeout = setTimeout(
         (->
            delay_animation(later)),
         remaining)
      return result

  class PlotView extends ContinuumView.View
    className: "bokeh plotview"
    events:
      "mousemove .bokeh_canvas_wrapper": "_mousemove"
      "touchmove .bokeh_canvas_wrapper": "_mousemove"
      "click .toggle_menu": "_toggle_menubar"
      "click .gear-icon": "_open_popup"
      "mousedown .bokeh_canvas_wrapper": "_mousedown"
      "touchstart .bokeh_canvas_wrapper": "_mousedown"
      "mousedown .object_inspector_window, .plot_info_window": "_show_modal_window"
      "touchend .object_inspector_window, .plot_info_window": "_show_modal_window"
      "mousedown .modal_window_close": "_close_modal_window"
      "touchend .modal_window_close": "_close_modal_window"
    
    view_options: () ->
      _.extend({plot_model: @model, plot_view: @}, @options)

    _mousedown: (e) =>
      for f in @mousedownCallbacks
        f(e, e.layerX, e.layerY)

    _mousemove: (e) =>
      for f in @moveCallbacks
        f(e, e.layerX, e.layerY)
    
    _toggle_menubar: (e) =>
      @button_bar.toggleClass("hide")
      @toggle_icon.toggleClass("icon-list")
      @toggle_icon.toggleClass("icon-chevron-left")
    
    _open_popup: (e) =>
      position = @gear_menu_icon.position()
      popup_left = position.left - @show_popup.outerWidth() / 2
      popup_top = position.top - @show_popup.outerHeight() - @gear_menu_icon.outerHeight()
      @show_popup.attr('style', "left:#{popup_left}px; top:#{popup_top}px;")
      @show_popup.toggleClass('show_popup')

    _show_modal_window: (e) =>
      @window_title = ""
      @embed_modal_content = ""
      if e.target.className == "object_inspector_window"
        @window_title = "Object Inspector"
        @embed_modal_content = $("<div class='modal_body_content'></div>")
        @$object_explorer_view = new ObjectExplorer.View({
          el: @embed_modal_content
        })  
      else if e.target.className == "plot_info_window"
        @window_title = "Plot Info"
        datasource = "Embedded in the HTML file"
        if window.location.host != ""
          datasource = "Loaded from the #{window.location.host} server"
        @embed_modal_content += "<div class='modal_body_head'>Bokeh Version</div>"
        @embed_modal_content += "<div class='modal_body_content'>#{Bokeh.version}</div>"
        @embed_modal_content += "<div class='modal_body_head'>Data Source</div>"
        @embed_modal_content += "<div class='modal_body_content'>#{datasource}</div>"
      else
        return null
      @_modal_window_content(e)

    _modal_window_content: (e) =>
      @$el.find('.modal_window_title').html(@window_title)
      @$el.find('.modal_body').html(@embed_modal_content)
      if e.target.className == "object_inspector_window"
        @$el.find('.bokeh_modal_window').attr("style", "top:auto; width:570px; margin:0 14px 14px; position:relative; display:block;")
        @$el.find('.modal_window_title').css("width", "538px");
        height = @$el.find('.modal_window_title').outerHeight(true)
        @$el.find('.modal_header').attr('style', "height:#{height}px;")
      else
        position = @canvas_footer.position()
        top = position.top - @$el.find('.bokeh_modal_window').outerHeight(true)
        width = @canvas_wrapper.outerWidth(true)
        @$el.find('.bokeh_modal_window').attr("style", "top:#{top}px; left:#{width}px; display:block;")
        @$el.find('.modal_window_title').attr("style", "");
        height = @$el.find('.modal_window_title').outerHeight(true)
        @$el.find('.modal_header').attr('style', "height:#{height}px")
      
    _close_modal_window: (e) =>
      @$el.find('.bokeh_modal_window').hide()
      @$el.find('.modal_window_title').html("")
      @$el.find('.modal_body').html("")
    
    pause: () ->
      @is_paused = true

    unpause: (render_canvas=false) ->
      @is_paused = false
      if render_canvas
        @request_render_canvas(true)
      else
        @request_render()

    request_render: () ->
      if not @is_paused
        @throttled_render()
      return

    request_render_canvas: (full_render) ->
      if not @is_paused
        @throttled_render_canvas(full_render)
      return

    initialize: (options) ->
      super(_.defaults(options, @default_options))

      #@throttled_render = _.throttle(@render, 15)
      @throttled_render = throttle_animation(@render, 15)
      @throttled_render_canvas = throttle_animation(@render_canvas, 15)
      @outline_props = new line_properties(@, {}, 'outline_')
      @title_props = new text_properties(@, {}, 'title_')

      @view_state = new ViewState({
        canvas_width:      options.canvas_width       ? @mget('canvas_width')
        canvas_height:     options.canvas_height      ? @mget('canvas_height')
        x_offset:          options.x_offset           ? @mget('x_offset')
        y_offset:          options.y_offset           ? @mget('y_offset')
        outer_width:       options.outer_width        ? @mget('outer_width')
        outer_height:      options.outer_height       ? @mget('outer_height')
        min_border_top:    (options.min_border_top    ? @mget('min_border_top'))    ? @mget('min_border')
        min_border_bottom: (options.min_border_bottom ? @mget('min_border_bottom')) ? @mget('min_border')
        min_border_left:   (options.min_border_left   ? @mget('min_border_left'))   ? @mget('min_border')
        min_border_right:  (options.min_border_right  ? @mget('min_border_right'))  ? @mget('min_border')
        frame:             options.frame              ? @mget('frame')
        resize_plot:       options.resize_plot        ? @mget('resize_plot')
        requested_border_top: 0
        requested_border_bottom: 0
        requested_border_left: 0
        requested_border_right: 0
      })

      @hidpi = options.hidpi ? @mget('hidpi')

      @x_range = options.x_range ? @mget_obj('x_range')
      @y_range = options.y_range ? @mget_obj('y_range')

      xmapper_type = LinearMapper.Model
      if @x_range.type == "FactorRange"
        xmapper_type = CategoricalMapper.Model
      @xmapper = new xmapper_type({
        source_range: @x_range
        target_range: @view_state.get('inner_range_horizontal')
      })

      ymapper_type = LinearMapper.Model
      if @y_range.type == "FactorRange"
        ymapper_type = CategoricalMapper.Model
      @ymapper = new ymapper_type({
        source_range: @y_range
        target_range: @view_state.get('inner_range_vertical')
      })

      @mapper = new GridMapper.Model({
        domain_mapper: @xmapper
        codomain_mapper: @ymapper
      })

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

      @eventSink = _.extend({}, Backbone.Events)
      @moveCallbacks = []
      @mousedownCallbacks = []
      @keydownCallbacks = []
      @render_init()
      @render_canvas(false)
      @atm = new ActiveToolManager(@eventSink)
      @levels = {}
      for level in LEVELS
        @levels[level] = {}
      @build_levels()
      @request_render()
      @atm.bind_bokeh_events()
      @bind_bokeh_events()
      return this

    # TODO (bev) why is this ignoring y units? why does it also take units as last arg?
    map_to_screen: (x, x_units, y, y_units) ->
      if x_units == 'screen'
        if _.isArray(x)
          sx = x[..]
        else
          sx = new Float64Array(x.length)
          sx.set(x)
      else
        sx = @xmapper.v_map_to_target(x)
      if y_units == 'screen'
        if _.isArray(y)
          sy = y[..]
        else
          sy = new Float64Array(y.length)
          sy.set(y)
      else
        sy = @ymapper.v_map_to_target(y)

      sx = @view_state.v_vx_to_sx(sx)
      sy = @view_state.v_vy_to_sy(sy)

      return [sx, sy]

    map_from_screen: (sx, sy, units) ->
      if _.isArray(sx)
        dx = sx[..]
      else
        dx = new Float64Array(sx.length)
        dx.set(x)
      if _.isArray(sy)
        dy = sy[..]
      else
        dy = new Float64Array(sy.length)
        dy.set(y)
      sx = @view_state.v_sx_to_vx(dx)
      sy = @view_state.v_sy_to_vy(dy)

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
      @x_range.set(range_info.xr)
      @y_range.set(range_info.yr)
      @unpause()

    build_tools: () ->
      return build_views(@tools, @mget_obj('tools'), @view_options())

    build_views: () ->
      return build_views(@renderers, @mget_obj('renderers'), @view_options())

    build_levels: () ->
      # need to separate renderer/tool creation from event binding
      # because things like box selection overlay needs to bind events
      # on the select tool
      #
      # should only bind events on NEW views and tools
      old_renderers = _.keys(@renderers)
      views = @build_views()
      renderers_to_remove = _.difference(old_renderers, _.pluck(@mget_obj('renderers'), 'id'))
      console.log('renderers_to_remove', renderers_to_remove)
      for id_ in renderers_to_remove
        delete @levels.glyph[id_]
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
      safebind(this, @view_state, 'change', () =>
        @request_render_canvas()
        @request_render()
      )
      safebind(this, @x_range, 'change', @request_render)
      safebind(this, @y_range, 'change', @request_render)
      safebind(this, @model, 'change:renderers', @build_levels)
      safebind(this, @model, 'change:tool', @build_levels)
      safebind(this, @model, 'change', @request_render)
      safebind(this, @model, 'destroy', () => @remove())

    render_init: () ->
      # TODO use template
      @$el.append($("""
        
    <div class='plotarea'>
    <div class='bokeh_canvas_header hide'>
      <a href="http://bokeh.pydata.org/" class="logo"></a>
      <i  class='icon-remove frame_close'></i>
    </div>
    <div class='bokeh_canvas_wrapper'  >
      <canvas class='bokeh_canvas'></canvas>
    </div>
    <div class="bokeh_canvas_footer hide">
    <div class='hide button_bar btn-group pull-top'/>
    <div class="button_icon">
      <i class='toggle_menu icon-list'></i>
      <i class='gear-icon icon-cog'></i>
    </div>
    </div>
    <ul class="popup_menu dropdown-menu">
      <li><a class="object_inspector_window">Object Inspector</a></li>
      <li><a class="plot_info_window">Plot Info</a></li>
    </ul>
    <div class='bokeh_modal_window'>
    <div class="modal_header">
      <h3 class="modal_window_title"></h3>
      <i  class='icon-remove modal_window_close'></i>
    </div>
    <div class="modal_footer">
    <div class="modal_body">
    </div>
    </div>
    </div>
    </div>
    </div>
        """))
        
      @toggle_icon = @$el.find('.toggle_menu')
      @button_bar = @$el.find('.button_bar')
      @show_popup = @$el.find('.popup_menu')
      @gear_menu_icon = @$el.find('.gear-icon')
      @frame_close = @$el.find('.frame_close')
      @canvas_header = @$el.find('.bokeh_canvas_header')
      @canvas_wrapper = @$el.find('.bokeh_canvas_wrapper')
      @canvas_footer = @$el.find('.bokeh_canvas_footer')
      @canvas = @$el.find('canvas.bokeh_canvas')
      @plot_frame = @$el.find('.plotarea')
      @plot_modal_window = @$el.find('.bokeh_modal_window')
      
      if @mget('frame') == "on"
        @canvas_header.removeClass('hide')
        @canvas_footer.removeClass('hide')
        @$el.find('.plotarea').addClass('frame')

    render_canvas: (full_render=true) ->
      @ctx = @canvas[0].getContext('2d')

      if @hidpi
        devicePixelRatio = window.devicePixelRatio || 1
        backingStoreRatio = @ctx.webkitBackingStorePixelRatio ||
                            @ctx.mozBackingStorePixelRatio ||
                            @ctx.msBackingStorePixelRatio ||
                            @ctx.oBackingStorePixelRatio ||
                            @ctx.backingStorePixelRatio || 1
        ratio = devicePixelRatio / backingStoreRatio
      else
        ratio = 1

      ow = @view_state.get('outer_width')
      oh = @view_state.get('outer_height')

      @canvas.width = ow * ratio
      @canvas.height = oh * ratio
      
      @button_bar.attr('style', "width: 85%; padding-left: 12px; float:left;")
      @canvas_wrapper.attr('style', "width:#{ow}px; height:#{oh}px; float:left;")
      @canvas.attr('style', "width:#{ow}px;")
      @canvas.attr('style', "height:#{oh}px;")
      @canvas.attr('width', ow*ratio).attr('height', oh*ratio)
      @$el.attr("width", ow).attr('height', oh)
      @canvas_header.attr('style', "width:#{ow}px;")
      @canvas_footer.attr('style', "width:#{ow}px;")
      @plot_frame.attr('style', "width:#{ow}px;")
      @plot_modal_window.attr('style', "left:#{ow}px;")

      @ctx.scale(ratio, ratio)
      @ctx.translate(0.5, 0.5)

      if full_render
        @render()

    save_png: () ->
      @render()
      data_uri = @canvas[0].toDataURL()
      @model.set('png', @canvas[0].toDataURL())
      bulk_save([@model])

    set_initial_range : () ->
      #check for good values for ranges before setting initial range
      range_vals = [@x_range.get('start'), @x_range.get('end'),
        @y_range.get('start'), @y_range.get('end')]
      good_vals = _.map(range_vals, (val) -> val? and not _.isNaN(val))
      good_vals = _.all(good_vals)
      if good_vals
        @initial_range_info = {
          xr: { start: @x_range.get('start'), end: @x_range.get('end') }
          yr: { start: @y_range.get('start'), end: @y_range.get('end') }
        }

    render: (force) ->
      super()
      #newtime = new Date()
      # if @last_render
      #   console.log(newtime - @last_render)
      # @last_render = newtime

      if not @initial_range_info?
        @set_initial_range()

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
        th = @ctx.measureText(@mget('title')).ascent
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

      @ctx.fillStyle = @mget('border_fill')
      @ctx.fillRect(0, 0,  @view_state.get('canvas_width'), @view_state.get('canvas_height')) # TODO
      @ctx.fillStyle = @mget('background_fill')
      @ctx.fillRect(
        @view_state.get('border_left'), @view_state.get('border_top'),
        @view_state.get('inner_width'), @view_state.get('inner_height'),
      )

      if @outline_props.do_stroke
        @outline_props.set(@ctx, {})
        @ctx.strokeRect(
          @view_state.get('border_left'), @view_state.get('border_top'),
          @view_state.get('inner_width'), @view_state.get('inner_height'),
        )

      have_new_mapper_state = false
      xms = @xmapper.get('mapper_state')[0]
      yms = @ymapper.get('mapper_state')[0]
      if Math.abs(@old_mapper_state.x-xms) > 1e-8 or Math.abs(@old_mapper_state.y - yms) > 1e-8
        @old_mapper_state.x = xms
        @old_mapper_state.y = yms
        have_new_mapper_state = true

      @ctx.save()

      @ctx.beginPath()
      @ctx.rect(
        @view_state.get('border_left'), @view_state.get('border_top'),
        @view_state.get('inner_width'), @view_state.get('inner_height'),
      )
      @ctx.clip()
      @ctx.beginPath()

      for level in ['image', 'underlay', 'glyph']
        renderers = @levels[level]
        for k, v of renderers
          v.render(have_new_mapper_state)

      @ctx.restore()

      @render_overlays(have_new_mapper_state)

      if title
        sx = @view_state.get('outer_width')/2
        sy = th
        @ctx.fillText(title, sx, sy)

    render_overlays: (have_new_mapper_state) ->
      for level in ['overlay', 'annotation', 'tool']
        renderers = @levels[level]
        for k, v of renderers
          v.render(have_new_mapper_state)

  class Plot extends HasParent
    type: 'Plot'
    default_view: PlotView

    add_renderers: (new_renderers) ->
      renderers = @get('renderers')
      renderers = renderers.concat(new_renderers)
      @set('renderers', renderers)

    parent_properties: [
      'background_fill',
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
        title: 'Plot',
      }

    display_defaults: () ->
      return {
        hidpi: true,
        background_fill: "#fff",
        border_fill: "#fff",
        border_symmetry: "h",
        min_border: 40,
        x_offset: 0,
        y_offset: 0,
        canvas_width: 300,
        canvas_height: 300,
        outer_width: 300,
        outer_height: 300,

        title_standoff: 8,
        title_text_font: "helvetica",
        title_text_font_size: "20pt",
        title_text_font_style: "normal",
        title_text_color: "#444444",
        title_text_alpha: 1.0,
        title_text_align: "left",
        title_text_baseline: "alphabetic"

        outline_line_color: '#aaaaaa'
        outline_line_width: 1
        outline_line_alpha: 1.0
        outline_line_join: 'miter'
        outline_line_cap: 'butt'
        outline_line_dash: []
        outline_line_dash_offset: 0
      }

  class Plots extends Backbone.Collection
     model: Plot

  return {
    "Model": Plot,
    "Collection": new Plots(),
    "View": PlotView,
  }
