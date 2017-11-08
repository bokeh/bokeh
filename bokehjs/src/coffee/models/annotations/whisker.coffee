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
    frame = @plot_model.frame
    dim = @model.dimension

    xscale = frame.xscales[@model.x_range_name]
    yscale = frame.yscales[@model.y_range_name]

    limit_scale = if dim == "height" then yscale else xscale
    base_scale  = if dim == "height" then xscale else yscale

    limit_view = if dim == "height" then frame.yview else frame.xview
    base_view  = if dim == "height" then frame.xview else frame.yview

    if @model.lower.units == "data"
      _lower_sx = limit_scale.v_compute(@_lower)
    else
      _lower_sx = limit_view.v_compute(@_lower)

    if @model.upper.units == "data"
      _upper_sx = limit_scale.v_compute(@_upper)
    else
      _upper_sx = limit_view.v_compute(@_upper)

    if @model.base.units  == "data"
      _base_sx  = base_scale.v_compute(@_base)
    else
      _base_sx  = base_view.v_compute(@_base)

    [i, j] = if dim == 'height' then [1, 0] else [0, 1]

    _lower = [_lower_sx, _base_sx]
    _upper = [_upper_sx, _base_sx]

    @_lower_sx = _lower[i]
    @_lower_sy = _lower[j]

    @_upper_sx = _upper[i]
    @_upper_sy = _upper[j]

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
