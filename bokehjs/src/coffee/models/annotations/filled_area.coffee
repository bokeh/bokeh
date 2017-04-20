import {Annotation, AnnotationView} from "./annotation"
import {ColumnDataSource} from "../sources/column_data_source"

import * as p from "core/properties"

export class FilledAreaView extends AnnotationView
  initialize: (options) ->
    super(options)
    @set_data(@model.source)

  bind_bokeh_events: () ->
    super()
    @listenTo(@model.source, 'change', () ->
      @set_data(@model.source)
      @plot_view.request_render())

  set_data: (source) ->
    super(source)
    @visuals.warm_cache(source)

  _map_data: () ->
    [i, j] = @model._normals()
    lower = [@_lower, @_coords]
    upper = [@_upper, @_coords]
    @_lower_sx_sy = @map_to_screen(lower[i], lower[j])
    @_upper_sx_sy = @map_to_screen(upper[i], upper[j])

  render: () ->
    if not @model.visible
      return

    @_map_data()

    ctx = @plot_view.canvas_view.ctx

    sx = @_lower_sx_sy[0]
    sy = @_lower_sx_sy[1]
    # Set start point as
    ctx.beginPath()
    ctx.moveTo(sx[0], sy[0])
    for i in [0...sx.length]
      ctx.lineTo(sx[i], sy[i])

    sx = @_upper_sx_sy[0]
    sy = @_upper_sx_sy[1]
    # iterate backwards so that end is below start
    for i in [sx.length-1..0]
      ctx.lineTo(sx[i], sy[i])

    ctx.closePath()

    if @visuals.line.doit
      @visuals.line.set_value(ctx)
      ctx.stroke()

    if @visuals.fill.doit
      @visuals.fill.set_value(ctx)
      ctx.fill()

export class FilledArea extends Annotation
  default_view: FilledAreaView
  type: 'FilledArea'

  @mixins ['line', 'fill']

  @define {
    lower:        [ p.NumberSpec                      ]
    upper:        [ p.NumberSpec                      ]
    coords:       [ p.NumberSpec,                     ]
    dimension:    [ p.Dimension,  'height'            ]
    source:       [ p.Instance,     () -> new ColumnDataSource()  ]
    x_range_name: [ p.String,      'default'          ]
    y_range_name: [ p.String,      'default'          ]
  }

  _normals: () ->
    if @dimension == 'height'
      [i, j] = [1, 0]
    else
      [i, j] = [0, 1]
    return [i, j]
