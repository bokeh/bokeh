import * as _ from "underscore"

import * as Annotation from "./annotation"
import {OpenHead} from "./arrow_head"
import * as ColumnDataSource from "../sources/column_data_source"
import * as p from "../../core/properties"
import {atan2} from "../../core/util/math"

class ArrowView extends Annotation.View
  initialize: (options) ->
    super(options)
    if not @model.source?
      this.model.source = new ColumnDataSource.Model()
    @canvas = @plot_model.canvas
    @xmapper = @plot_view.frame.x_mappers[@model.x_range_name]
    @ymapper = @plot_view.frame.y_mappers[@model.y_range_name]
    @set_data(@model.source)

  bind_bokeh_events: () ->
    @listenTo(@model, 'change', @plot_view.request_render)
    @listenTo(@model.source, 'change', () ->
      @set_data(@model.source)
      @plot_view.request_render())

  set_data: (source) ->
    super(source)
    @visuals.warm_cache(source)

  _map_data: () ->
    if @model.start_units == 'data'
      start = @plot_view.map_to_screen(@_x_start, @_y_start,
                                       x_name=@model.x_range_name
                                       y_name=@model.y_range_name
                                       )
    else
      start = [@canvas.v_vx_to_sx(@_x_start),
               @canvas.v_vy_to_sy(@_y_start)]

    if @model.end_units == 'data'
      end = @plot_view.map_to_screen(@_x_end, @_y_end,
                                     x_name=@model.x_range_name
                                     y_name=@model.y_range_name
                                     )
    else
      end = [@canvas.v_vx_to_sx(@_x_end),
             @canvas.v_vy_to_sy(@_y_end)]

    return [start, end]

  render: () ->
    [@start, @end] = @_map_data()
    @_draw_arrow_body()
    if @model.end? then @_draw_arrow_head(@model.end, @start, @end)
    if @model.start? then @_draw_arrow_head(@model.start, @end, @start)

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
      end:              [ p.Instance,    new OpenHead({})       ]
      source:           [ p.Instance                            ]
      x_range_name:     [ p.String,      'default'              ]
      y_range_name:     [ p.String,      'default'              ]
  }

export {
  Arrow as Model
  ArrowView as View
}
