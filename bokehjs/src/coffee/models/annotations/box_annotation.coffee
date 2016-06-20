_ = require "underscore"

Annotation = require "./annotation"
p = require "../../core/properties"

class BoxAnnotationView extends Annotation.View
  initialize: (options) ->
    super(options)
    @$el.appendTo(@plot_view.$el.find('div.bk-canvas-overlays'))
    @$el.addClass('bk-shading')
    @$el.hide()

  bind_bokeh_events: () ->
    # need to respond to either normal BB change events or silent
    # "data only updates" that tools might want to use
    if @mget('render_mode') == 'css'
      # dispatch CSS update immediately
      @listenTo(@model, 'change', @render)
      @listenTo(@model, 'data_update', @render)
    else
      @listenTo(@model, 'change', @plot_view.request_render)
      @listenTo(@model, 'data_update', @plot_view.request_render)

  render: () ->
    # don't render if *all* position are null
    if not @mget('left')? and not @mget('right')? and not @mget('top')? and not @mget('bottom')?
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

    @visuals.fill.set_value(ctx)
    ctx.fill()

    @visuals.line.set_value(ctx)
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

class BoxAnnotation extends Annotation.Model
  default_view: BoxAnnotationView

  type: 'BoxAnnotation'

  @mixins ['line', 'fill']

  @define {
      render_mode:  [ p.RenderMode,   'canvas'  ]
      x_range_name: [ p.String,       'default' ]
      y_range_name: [ p.String,       'default' ]
      top:          [ p.Number,       null      ]
      top_units:    [ p.SpatialUnits, 'data'    ]
      bottom:       [ p.Number,       null      ]
      bottom_units: [ p.SpatialUnits, 'data'    ]
      left:         [ p.Number,       null      ]
      left_units:   [ p.SpatialUnits, 'data'    ]
      right:        [ p.Number,       null      ]
      right_units:  [ p.SpatialUnits, 'data'    ]
  }

  @override {
    fill_color: '#fff9ba'
    fill_alpha: 0.4
    line_color: '#cccccc'
    line_alpha: 0.3
  }

  update:({left, right, top, bottom}) ->
    @set({left: left, right: right, top: top, bottom: bottom}, {silent: true})
    @trigger('data_update')

module.exports =
  Model: BoxAnnotation
  View: BoxAnnotationView
