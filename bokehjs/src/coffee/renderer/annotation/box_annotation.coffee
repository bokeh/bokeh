_ = require "underscore"
HasParent = require "../../common/has_parent"
PlotWidget = require "../../common/plot_widget"
properties = require "../../common/properties"

class BoxAnnotationView extends PlotWidget
  initialize: (options) ->
    super(options)
    @fill_props = new properties.Fill({obj: @model, prefix: ''})
    @line_props = new properties.Line({obj: @model, prefix: ''})
    @$el.appendTo(@plot_view.$el.find('div.bk-canvas-overlays'))
    @$el.addClass('shading')
    @$el.hide()

  bind_bokeh_events: () ->
    if @mget('render_mode') == 'css'
      # dispatch CSS update immediately
      @listenTo(@model, 'data_update', @render)
    else
      @listenTo(@model, 'data_update', @plot_view.request_render)

  render: () ->
    # don't render if *all* position are null
    if not @mget('left')? and not @mget('right')? not @mget('top')? and not @mget('bottom')?
      @$el.hide()
      return null

    @frame = @plot_model.get('frame')
    @canvas = @plot_model.get('canvas')
    @xmapper = @plot_view.frame.get('x_mappers')[@mget("x_range_name")]
    @ymapper = @plot_view.frame.get('y_mappers')[@mget("y_range_name")]

    sleft = @canvas.vx_to_sx(@_calc_dim('left', @xmapper, @frame.get('h_range').get('start')))
    sright = @canvas.vx_to_sx(@_calc_dim('right', @xmapper, @frame.get('h_range').get('end')))
    sbottom = @canvas.vy_to_sy(@_calc_dim('bottom', @ymapper, @frame.get('v_range').get('start')))
    stop = @canvas.vy_to_sy(@_calc_dim('top', @ymapper, @frame.get('v_range').get('end')))

    if @mget('render_mode') == 'css'
      @_css_box(sleft, sright, sbottom, stop)

    else
      @_canvas_box(sleft, sright, sbottom, stop)

  _css_box: (sleft, sright, sbottom, stop) ->
    sw = Math.abs(sright-sleft)
    sh = Math.abs(sbottom-stop)

    lw = @mget("line_width").value
    lc = @mget("line_color").value
    bc = @mget("fill_color").value
    ba = @mget("fill_alpha").value
    style = "left:#{sleft}px; width:#{sw}px; top:#{stop}px; height:#{sh}px; border-width:#{lw}px; border-color:#{lc}; background-color:#{bc}; opacity:#{ba};"
    # try our best to honor line dashing in some way, if we can
    ld = @mget("line_dash")
    if _.isArray(ld)
      if ld.length < 2
        ld = "solid"
      else
        ld = "dashed"
    if _.isString(ld)
      style += " border-style:#{ld};"
    @$el.attr('style', style)
    @$el.show()

  _canvas_box: (sleft, sright, sbottom, stop) ->
    ctx = @plot_view.canvas_view.ctx
    ctx.save()

    ctx.beginPath()
    ctx.rect(sleft, stop, sright-sleft, sbottom-stop)

    @fill_props.set_value(ctx)
    ctx.fill()

    @line_props.set_value(ctx)
    ctx.stroke()

    ctx.restore()

  _calc_dim: (dim, mapper, frame_extrema) ->
    if @mget(dim)?
      if @mget(dim+'_units') == 'data'
        vdim = mapper.map_to_target(@mget(dim))
      else
        vdim = @mget(dim)
    else
      vdim = frame_extrema
    return vdim

class BoxAnnotation extends HasParent
  default_view: BoxAnnotationView
  type: 'BoxAnnotation'

  nonserializable_attribute_names: () ->
    super().concat(['silent_update'])

  update:({left, right, top, bottom}) ->
    if @get('silent_update')
      @attributes['left'] = left
      @attributes['right'] = right
      @attributes['top'] = top
      @attributes['bottom'] = bottom
    else
      @set({left: left, right: right, top: top, bottom: bottom})
    @trigger('data_update')

  defaults: ->
    return _.extend {}, super(), {
      silent_update: false
      render_mode: "canvas"
      x_range_name: "default"
      y_range_name: "default"
      level: 'annotation'
      left_units: 'data'
      right_units: 'data'
      top_units: 'data'
      bottom_units: 'data'
      fill_color: '#fff9ba'
      fill_alpha: 0.4
      line_color: '#cccccc'
      line_width: 1
      line_alpha: 0.3
      line_join: 'miter'
      line_cap: 'butt'
      line_dash: []
      line_dash_offset: 0
    }

module.exports =
  Model: BoxAnnotation
  View: BoxAnnotationView
