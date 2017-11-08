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
    @set_data(@model.source)

  connect_signals: () ->
    super()
    @connect(@model.change, () => @plot_view.request_render())
    @connect(@model.source.streaming, () -> @set_data(@model.source))
    @connect(@model.source.patching, () -> @set_data(@model.source))
    @connect(@model.source.change, () -> @set_data(@model.source))

  set_data: (source) ->
    super(source)
    @visuals.warm_cache(source)
    @plot_view.request_render()

  _map_data: () ->
    frame = @plot_view.frame

    if @model.start_units == 'data'
      sx_start = frame.xscales[@model.x_range_name].v_compute(@_x_start)
      sy_start = frame.yscales[@model.y_range_name].v_compute(@_y_start)
    else
      sx_start = frame.xview.v_compute(@_x_start)
      sy_start = frame.yview.v_compute(@_y_start)

    if @model.end_units == 'data'
      sx_end = frame.xscales[@model.x_range_name].v_compute(@_x_end)
      sy_end = frame.yscales[@model.y_range_name].v_compute(@_y_end)
    else
      sx_end = frame.xview.v_compute(@_x_end)
      sy_end = frame.yview.v_compute(@_y_end)

    start = [sx_start, sy_start]
    end   = [sx_end,   sy_end  ]

    return [start, end]

  render: () ->
    if not @model.visible
      return

    ctx = @plot_view.canvas_view.ctx
    ctx.save()

    # Order in this function is important. First we draw all the arrow heads.
    [@start, @end] = @_map_data()
    if @model.end? then @_arrow_head(ctx, "render", @model.end, @start, @end)
    if @model.start? then @_arrow_head(ctx, "render", @model.start, @end, @start)

    # Next we call .clip on all the arrow heads, inside an initial canvas sized
    # rect, to create an "inverted" clip region for the arrow heads
    ctx.beginPath()
    {x, y, width, height} = @plot_model.canvas.bbox.rect
    ctx.rect(x, y, width, height)
    if @model.end? then @_arrow_head(ctx, "clip", @model.end, @start, @end)
    if @model.start? then @_arrow_head(ctx, "clip", @model.start, @end, @start)
    ctx.closePath()
    ctx.clip()

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
