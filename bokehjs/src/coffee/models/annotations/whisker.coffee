import {Annotation, AnnotationView} from "./annotation"
import {ColumnDataSource} from "../sources/column_data_source"
import {TeeHead} from "./arrow_head"

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

    [i, j] = @model._normals()
    _lower = [_lower_vx, _base_vx]
    _upper = [_upper_vx, _base_vx]

    @_lower_sx = @plot_model.canvas.v_vx_to_sx(_lower[i])
    @_lower_sy = @plot_model.canvas.v_vy_to_sy(_lower[j])

    @_upper_sx = @plot_model.canvas.v_vx_to_sx(_upper[i])
    @_upper_sy = @plot_model.canvas.v_vy_to_sy(_upper[j])

  render: () ->
    if not @model.visible
      return

    @_map_data()

    ctx = @plot_view.canvas_view.ctx

    if @visuals.line.doit
      for i in [0...@_lower_sx.length]
        @visuals.line.set_vectorize(ctx, i)
        ctx.beginPath()
        ctx.moveTo(@_lower_sx[i], @_lower_sy[i])
        ctx.lineTo(@_upper_sx[i], @_upper_sy[i])
        ctx.stroke()

    angle = if @model.dimension == "height" then 0 else Math.PI / 2

    if @model.lower_head?
      for i in [0...@_lower_sx.length]
        ctx.save()
        ctx.translate(@_lower_sx[i], @_lower_sy[i])
        ctx.rotate(angle + Math.PI)
        @model.lower_head.render(ctx, i)
        ctx.restore()

    if @model.upper_head?
      for i in [0...@_upper_sx.length]
        ctx.save()
        ctx.translate(@_upper_sx[i], @_upper_sy[i])
        ctx.rotate(angle)
        @model.upper_head.render(ctx, i)
        ctx.restore()

export class Whisker extends Annotation
  default_view: WhiskerView
  type: 'Whisker'

  @mixins ['line']

  @define {
    lower:        [ p.DistanceSpec                    ]
    lower_head:   [ p.Instance,     () -> new TeeHead({level: "underlay", size: 10}) ]
    upper:        [ p.DistanceSpec                    ]
    upper_head:   [ p.Instance,     () -> new TeeHead({level: "underlay", size: 10}) ]
    base:         [ p.DistanceSpec                    ]
    dimension:    [ p.Dimension,    'height'          ]
    source:       [ p.Instance,     () -> new ColumnDataSource()                     ]
    x_range_name: [ p.String,       'default'         ]
    y_range_name: [ p.String,       'default'         ]
  }

  @override {
    level: 'underlay'
  }

  _normals: () ->
    if @dimension == 'height'
      [i, j] = [1, 0]
    else
      [i, j] = [0, 1]
    return [i, j]
