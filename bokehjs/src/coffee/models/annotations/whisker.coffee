import {Annotation, AnnotationView} from "./annotation"
import {ColumnDataSource} from "../sources/column_data_source"

import * as p from "core/properties"

export class WhiskerView extends AnnotationView
  initialize: (options) ->
    super(options)
    @set_data(@model.source)

  connect_signals: () ->
    super()
    @connect(@model.source.streaming, () -> @set_data(@model.source))
    @connect(@model.source.patching, () -> @set_data(@model.source))
    @connect(@model.source.change, () -> @set_data(@model.source))

  set_data: (source) ->
    super(source)
    @visuals.warm_cache(source)
    @plot_view.request_render()

  _map_data: () ->
    x_scale = @plot_view.frame.xscales[@model.x_range_name]
    y_scale = @plot_view.frame.yscales[@model.y_range_name]

    limit_scale = if @model.dimension == "height" then y_scale else x_scale
    base_scale = if @model.dimension == "height" then x_scale else y_scale

    if @model.lower.units == "data"
      _lower_vx = limit_scale.v_compute(@_lower)
    else
      _lower_vx = @_lower

    if @model.upper.units == "data"
      _upper_vx = limit_scale.v_compute(@_upper)
    else
      _upper_vx = @_upper

    if @model.base.units == "data"
      _base_vx = base_scale.v_compute(@_base)
    else
      _base_vx = @_base

    @_canvas = @plot_model.canvas
    [i, j] = @model._normals()
    _lower = [_lower_vx, _base_vx]
    _upper = [_upper_vx, _base_vx]

    @_lower_sx = @_canvas.v_vx_to_sx(_lower[i])
    @_lower_sy = @_canvas.v_vy_to_sy(_lower[j])

    @_upper_sx = @_canvas.v_vx_to_sx(_upper[i])
    @_upper_sy = @_canvas.v_vy_to_sy(_upper[j])

  render: () ->
    if not @model.visible
      return

    @_map_data()

    ctx = @plot_view.canvas_view.ctx

    # draw the whisker bodies
    if @visuals.body_line.doit
      for i in [0...@_lower_sx.length]
        ctx.beginPath()
        ctx.moveTo(@_lower_sx[i], @_lower_sy[i])
        ctx.lineTo(@_upper_sx[i], @_upper_sy[i])
        ctx.stroke()

    if @visuals.whisker_line.doit
      mid_length = @model.length / 2
      for i in [0...@_lower_sx.length]

        # draw the bottom whiskers
        ctx.beginPath()
        switch @model.dimension
          when "height"
            ctx.moveTo(@_lower_sx[i] - mid_length, @_lower_sy[i])
            ctx.lineTo(@_lower_sx[i] + mid_length, @_lower_sy[i])
          when "width"
            ctx.moveTo(@_lower_sx[i], @_lower_sy[i] - mid_length)
            ctx.lineTo(@_lower_sx[i], @_lower_sy[i] + mid_length)
        ctx.stroke()

        # draw the top whiskers
        ctx.beginPath()
        switch @model.dimension
          when "height"
            ctx.moveTo(@_upper_sx[i] - mid_length, @_upper_sy[i])
            ctx.lineTo(@_upper_sx[i] + mid_length, @_upper_sy[i])
          when "width"
            ctx.moveTo(@_upper_sx[i], @_upper_sy[i] - mid_length)
            ctx.lineTo(@_upper_sx[i], @_upper_sy[i] + mid_length)
        ctx.stroke()

export class Whisker extends Annotation
  default_view: WhiskerView
  type: 'Whisker'

  @mixins ['line:whisker_', 'line:body_']

  @define {
    lower:        [ p.DistanceSpec                    ]
    upper:        [ p.DistanceSpec                    ]
    length:       [ p.Int,           20               ]
    base:         [ p.DistanceSpec                    ]
    dimension:    [ p.Dimension,    'height'          ]
    source:       [ p.Instance,     () -> new ColumnDataSource()  ]
    x_range_name: [ p.String,       'default'         ]
    y_range_name: [ p.String,       'default'         ]
  }

  _normals: () ->
    if @dimension == 'height'
      [i, j] = [1, 0]
    else
      [i, j] = [0, 1]
    return [i, j]
