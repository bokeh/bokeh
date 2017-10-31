import {Annotation, AnnotationView} from "./annotation"
import {ColumnDataSource} from "../sources/column_data_source"

import * as p from "core/properties"

export class BandView extends AnnotationView
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
    frame = @plot_view.frame
    x_scale = frame.xscales[@model.x_range_name]
    y_scale = frame.yscales[@model.y_range_name]

    limit_scale = if @model.dimension == "height" then y_scale else x_scale
    base_scale = if @model.dimension == "height" then x_scale else y_scale

    _lower_vx = if @model.lower.units == "data" then limit_scale.v_compute(@_lower) else @_lower
    _upper_vx = if @model.upper.units == "data" then limit_scale.v_compute(@_upper) else @_upper
    _base_vx  = if @model.base.units  == "data" then base_scale.v_compute(@_base)   else @_base

    [i, j] = @model._normals()
    _lower = [_lower_vx, _base_vx]
    _upper = [_upper_vx, _base_vx]

    @_lower_sx = frame.v_vx_to_Sx(_lower[i])
    @_lower_sy = frame.v_vy_to_Sy(_lower[j])

    @_upper_sx = frame.v_vx_to_Sx(_upper[i])
    @_upper_sy = frame.v_vy_to_Sy(_upper[j])

  render: () ->
    if not @model.visible
      return

    @_map_data()

    ctx = @plot_view.canvas_view.ctx

    # Draw the band body
    ctx.beginPath()
    ctx.moveTo(@_lower_sx[0], @_lower_sy[0])

    for i in [0...@_lower_sx.length]
      ctx.lineTo(@_lower_sx[i], @_lower_sy[i])
    # iterate backwards so that the upper end is below the lower start
    for i in [@_upper_sx.length-1..0]
      ctx.lineTo(@_upper_sx[i], @_upper_sy[i])

    ctx.closePath()

    if @visuals.fill.doit
      @visuals.fill.set_value(ctx)
      ctx.fill()

    # Draw the lower band edge
    ctx.beginPath()
    ctx.moveTo(@_lower_sx[0], @_lower_sy[0])
    for i in [0...@_lower_sx.length]
      ctx.lineTo(@_lower_sx[i], @_lower_sy[i])

    if @visuals.line.doit
      @visuals.line.set_value(ctx)
      ctx.stroke()

    # Draw the upper band edge
    ctx.beginPath()
    ctx.moveTo(@_upper_sx[0], @_upper_sy[0])
    for i in [0...@_upper_sx.length]
      ctx.lineTo(@_upper_sx[i], @_upper_sy[i])

    if @visuals.line.doit
      @visuals.line.set_value(ctx)
      ctx.stroke()

export class Band extends Annotation
  default_view: BandView
  type: 'Band'

  @mixins ['line', 'fill']

  @define {
    lower:        [ p.DistanceSpec                    ]
    upper:        [ p.DistanceSpec                    ]
    base:         [ p.DistanceSpec                    ]
    dimension:    [ p.Dimension,    'height'          ]
    source:       [ p.Instance,     () -> new ColumnDataSource()  ]
    x_range_name: [ p.String,       'default'         ]
    y_range_name: [ p.String,       'default'         ]
  }

  @override {
    fill_color: "#fff9ba"
    fill_alpha: 0.4
    line_color: "#cccccc"
    line_alpha: 0.3
  }

  _normals: () ->
    if @dimension == 'height'
      [i, j] = [1, 0]
    else
      [i, j] = [0, 1]
    return [i, j]
