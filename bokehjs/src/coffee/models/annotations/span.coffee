_ = require "underscore"

Annotation = require "./annotation"
p = require "../../core/properties"

class SpanView extends Annotation.View

  initialize: (options) ->
    super(options)
    @$el.appendTo(@plot_view.$el.find('div.bk-canvas-overlays'))
    @$el.css({position: 'absolute'})
    @$el.hide()

  bind_bokeh_events: () ->
    if @mget('for_hover')
      @listenTo(@model, 'change:computed_location', @_draw_span)
    else
      if @mget('render_mode') == 'canvas'
        @listenTo(@model, 'change:location', @plot_view.request_render)
      else
        @listenTo(@model, 'change:location', @_draw_span)

  render: () ->
    @_draw_span()

  _draw_span: () ->
    if @mget('for_hover')
      loc = @mget('computed_location')
    else
      loc = @mget('location')

    if not loc?
      @$el.hide()
      return

    frame = @plot_model.get('frame')
    canvas = @plot_model.get('canvas')
    xmapper = @plot_view.frame.get('x_mappers')[@mget("x_range_name")]
    ymapper = @plot_view.frame.get('y_mappers')[@mget("y_range_name")]

    if @mget('dimension') == 'width'
      stop = canvas.vy_to_sy(@_calc_dim(loc, ymapper))
      sleft = canvas.vx_to_sx(frame.get('left'))
      width = frame.get('width')
      height = @model.properties.line_width.value()
    else
      stop = canvas.vy_to_sy(frame.get('top'))
      sleft = canvas.vx_to_sx(@_calc_dim(loc, xmapper))
      width = @model.properties.line_width.value()
      height = frame.get('height')

    if @mget("render_mode") == "css"
      @$el.css({
        'top': stop,
        'left': sleft,
        'width': "#{width}px",
        'height': "#{height}px"
        'z-index': 1000
        'background-color': @model.properties.line_color.value()
        'opacity': @model.properties.line_alpha.value()
      })
      @$el.show()

    else if @mget("render_mode") == "canvas"
      ctx = @plot_view.canvas_view.ctx
      ctx.save()

      ctx.beginPath()
      @visuals.line.set_value(ctx)
      ctx.moveTo(sleft, stop)
      if @mget('dimension') == "width"
        ctx.lineTo(sleft + width, stop)
      else
        ctx.lineTo(sleft, stop + height)
      ctx.stroke()

      ctx.restore()

  _calc_dim: (location, mapper) ->
      if @mget('location_units') == 'data'
        vdim = mapper.map_to_target(location)
      else
        vdim = location
      return vdim

class Span extends Annotation.Model
  default_view: SpanView

  type: 'Span'

  @mixins ['line']

  @define {
      render_mode:    [ p.RenderMode,   'canvas'  ]
      x_range_name:   [ p.String,       'default' ]
      y_range_name:   [ p.String,       'default' ]
      location:       [ p.Number,       null      ]
      location_units: [ p.SpatialUnits, 'data'    ]
      dimension:      [ p.Dimension,    'width'   ]
  }

  @override {
    line_color: 'black'
  }

  @internal {
    for_hover: [ p.Boolean, false ]
    computed_location: [ p.Number, null ]
  }

module.exports =
  Model: Span
  View: SpanView
