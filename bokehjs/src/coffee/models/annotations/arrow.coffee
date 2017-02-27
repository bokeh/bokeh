import {Annotation, AnnotationView} from "./annotation"
import {OpenHead} from "./arrow_head"
import {ColumnDataSource} from "../sources/column_data_source"
import * as p from "core/properties"
import {atan2} from "core/util/math"

export class ArrowView extends AnnotationView
  initialize: (options) ->
    super(options)
    if not @model.source?
      this.model.source = new ColumnDataSource()
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
    ctx = @plot_view.canvas_view.ctx
    ctx.save()

    # Order in this function is important. First we draw all the arrow heads.
    [@start, @end] = @_map_data()
    if @model.end? then @_arrow_head(ctx, "render", @model.end, @start, @end)
    if @model.start? then @_arrow_head(ctx, "render", @model.start, @end, @start)

    # Next we call .clip on all the arrow heads, inside an initial canvas sized
    # rect, to create an "inverted" clip region for the arrow heads
    ctx.beginPath();
    ctx.rect(0, 0, @canvas.width, @canvas.height);
    if @model.end? then @_arrow_head(ctx, "clip", @model.end, @start, @end)
    if @model.start? then @_arrow_head(ctx, "clip", @model.start, @end, @start)
    ctx.closePath()
    ctx.clip();

    # Finally we draw the arrow body, with the clipping regions set up. This prevents
    # "fat" arrows from overlapping the arrow head in a bad way.
    @_arrow_body(ctx)

    ctx.restore()

  _arrow_body: (ctx) ->
    if not @visuals.line.doit
      return

    for i in [0...@_x_start.length]
        @visuals.line.set_vectorize(ctx, i)

        ctx.beginPath()
        ctx.moveTo(@start[0][i], @start[1][i])
        ctx.lineTo(@end[0][i], @end[1][i])
        ctx.stroke()

  _arrow_head: (ctx, action, head, start, end) ->
    for i in [0...@_x_start.length]

      # arrow head runs orthogonal to arrow body
      angle = Math.PI/2 + atan2([start[0][i], start[1][i]], [end[0][i], end[1][i]])

      ctx.save()

      ctx.translate(end[0][i], end[1][i])
      ctx.rotate(angle)

      if action == "render"
        head.render(ctx)
      else if action == "clip"
        head.clip(ctx)

      ctx.restore()

export class Arrow extends Annotation
  default_view: ArrowView

  type: 'Arrow'

  @mixins ['line']

  @define {
      x_start:      [ p.NumberSpec,                   ]
      y_start:      [ p.NumberSpec,                   ]
      start_units:  [ p.String,      'data'           ]
      start:        [ p.Instance,    null             ]
      x_end:        [ p.NumberSpec,                   ]
      y_end:        [ p.NumberSpec,                   ]
      end_units:    [ p.String,      'data'           ]
      end:          [ p.Instance,    new OpenHead({}) ]
      source:       [ p.Instance                      ]
      x_range_name: [ p.String,      'default'        ]
      y_range_name: [ p.String,      'default'        ]
  }
