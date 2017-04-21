import {Annotation, AnnotationView} from "./annotation"
import {ColumnDataSource} from "../sources/column_data_source"

import * as p from "core/properties"

export class BandView extends AnnotationView
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
    x_mapper = @plot_view.frame.x_mappers[@model.x_range_name]
    y_mapper = @plot_view.frame.y_mappers[@model.y_range_name]

    if @model.lower_units == "data"
      mapper = switch
        when @model.dimension == "height" then y_mapper
        when @model.dimension == "width" then x_mapper

      _lower_vx = mapper.v_map_to_target(@_lower)
    else
      _lower_vx = @_lower

    if @model.upper_units == "data"
      mapper = switch
        when @model.dimension == "height" then y_mapper
        when @model.dimension == "width" then x_mapper

      _upper_vx = mapper.v_map_to_target(@_upper)
    else
      _upper_vx = @_upper

    if @model.base_units == "data"
      mapper = switch
        # Note that the mapper is the opposite of the upper/lower mapper
        when @model.dimension == "height" then x_mapper
        when @model.dimension == "width" then y_mapper

      _base_vx = mapper.v_map_to_target(@_base)
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

    ctx.beginPath()

    # Draw the lower band edge
    ctx.moveTo(@_lower_sx[0], @_lower_sy[0])
    for i in [0...@_lower_sx.length]
      ctx.lineTo(@_lower_sx[i], @_lower_sy[i])

    # Draw the upper band edge
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
    lower:        [ p.NumberSpec                      ]
    lower_units:  [ p.SpatialUnits, 'data'            ]
    upper:        [ p.NumberSpec                      ]
    upper_units:  [ p.SpatialUnits, 'data'            ]
    base:         [ p.NumberSpec,                     ]
    base_units:   [ p.SpatialUnits, 'data'            ]
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
