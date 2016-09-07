_ = require "underscore"

Annotation = require "./annotation"
OpenHead = require("./arrow_head").OpenHead
ColumnDataSource = require "../sources/column_data_source"
p = require "../../core/properties"
{atan2} = require "../../core/util/math"

class ArrowView extends Annotation.View
  initialize: (options) ->
    super(options)
    if not @model.get('source')?
      this.model.set('source', new ColumnDataSource.Model())
    @canvas = @plot_model.get('canvas')
    @xmapper = @plot_view.frame.x_mappers[@model.get("x_range_name")]
    @ymapper = @plot_view.frame.y_mappers[@model.get("y_range_name")]
    @set_data()

  bind_bokeh_events: () ->
    @listenTo(@model, 'change', @plot_view.request_render)
    @listenTo(@model.get('source'), 'change', () ->
      @set_data()
      @plot_view.request_render())

  set_data: () ->
    super(@model.get('source'))
    @set_visuals(@model.get('source'))

  _map_data: () ->
    if @model.get('start_units') == 'data'
      start = @plot_view.map_to_screen(@_x_start, @_y_start,
                                       x_name=@model.get('x_range_name')
                                       y_name=@model.get('y_range_name')
                                       )
    else
      start = [@canvas.v_vx_to_sx(@_x_start),
               @canvas.v_vy_to_sy(@_y_start)]

    if @model.get('end_units') == 'data'
      end = @plot_view.map_to_screen(@_x_end, @_y_end,
                                     x_name=@model.get('x_range_name')
                                     y_name=@model.get('y_range_name')
                                     )
    else
      end = [@canvas.v_vx_to_sx(@_x_end),
             @canvas.v_vy_to_sy(@_y_end)]

    return [start, end]

  render: () ->
    [@start, @end] = @_map_data()
    @_draw_arrow_body()
    if @model.get('end')? then @_draw_arrow_head(@model.get('end'), @start, @end)
    if @model.get('start')? then @_draw_arrow_head(@model.get('start'), @end, @start)

  _draw_arrow_body: () ->
    ctx = @plot_view.canvas_view.ctx

    ctx.save()
    for i in [0...@_x_start.length]
        @visuals.line.set_vectorize(ctx, i)
        ctx.beginPath()
        ctx.moveTo(@start[0][i], @start[1][i])
        ctx.lineTo(@end[0][i], @end[1][i])

        if @visuals.line.doit
          ctx.stroke()
    ctx.restore()

  _draw_arrow_head: (head, start, end) ->
    ctx = @plot_view.canvas_view.ctx

    for i in [0...@_x_start.length]

      # arrow head runs orthogonal to arrow body
      angle = Math.PI/2 + atan2([start[0][i], start[1][i]], [end[0][i], end[1][i]])

      ctx.save()
      ctx.translate(end[0][i], end[1][i])
      ctx.rotate(angle)

      head.render(ctx, i)

      ctx.restore()

class Arrow extends Annotation.Model
  default_view: ArrowView

  type: 'Arrow'

  @mixins ['line']

  @define {
      x_start:          [ p.NumberSpec,                         ]
      y_start:          [ p.NumberSpec,                         ]
      start_units:      [ p.String,      'data'                 ]
      start:            [ p.Instance,    null                   ]
      x_end:            [ p.NumberSpec,                         ]
      y_end:            [ p.NumberSpec,                         ]
      end_units:        [ p.String,      'data'                 ]
      end:              [ p.Instance,    new OpenHead.Model({}) ]
      source:           [ p.Instance                            ]
      x_range_name:     [ p.String,      'default'              ]
      y_range_name:     [ p.String,      'default'              ]
  }

module.exports =
  Model: Arrow
  View: ArrowView
