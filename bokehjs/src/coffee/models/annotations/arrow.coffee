_ = require "underscore"

Annotation = require "./annotation"
ColumnDataSource = require "../sources/column_data_source"
Renderer = require "../renderers/renderer"
p = require "../../core/properties"
{atan2} = require "../../core/util/math"

class ArrowView extends Renderer.View
  initialize: (options) ->
    super(options)
    if not @mget('source')?
      this.mset('source', new ColumnDataSource.Model())
    @canvas = @plot_model.get('canvas')
    @xmapper = @plot_view.frame.get('x_mappers')[@mget("x_range_name")]
    @ymapper = @plot_view.frame.get('y_mappers')[@mget("y_range_name")]
    @set_data()

  bind_bokeh_events: () ->
    @listenTo(@model, 'change', @plot_view.request_render)

  set_data: () ->
    super(@mget('source'))
    @set_visuals(@mget('source'))

  _map_data: () ->
    start = @plot_view.map_to_screen(@_x0, @_y0,
                                     x_name=@mget('x_range_name')
                                     y_name=@mget('y_range_name')
                                     )
    end = @plot_view.map_to_screen(@_x1, @_y1,
                                   x_name=@mget('x_range_name')
                                   y_name=@mget('y_range_name')
                                   )

    return [start, end]

  render: () ->
    [@start, @end] = @_map_data()
    @_draw_arrow_body()
    @_draw_arrow_head()

  _draw_arrow_body: () ->
    ctx = @plot_view.canvas_view.ctx

    ctx.save()
    for i in [0...@_x0.length]
        @visuals.line.set_vectorize(ctx, i)
        ctx.beginPath()
        ctx.moveTo(@start[0][i], @start[1][i])
        ctx.lineTo(@end[0][i], @end[1][i])

        if @visuals.line.doit
          ctx.stroke()
    ctx.restore()

  _draw_arrow_head: () ->
    ctx = @plot_view.canvas_view.ctx

    for i in [0...@_x0.length]

      angle = atan2([@start[0][i], @start[1][i]], [@end[0][i], @end[1][i]])

      if @visuals.fill.doit

        @visuals.fill.set_vectorize(ctx, i)
        ctx.save()
        ctx.translate(@end[0][i], @end[1][i])
        ctx.rotate(-Math.PI/2 + angle)
        ctx.beginPath()
        ctx.moveTo(0,0)
        ctx.lineTo(100, -100)
        ctx.lineTo(-100, -100)
        ctx.closePath()
        ctx.fill()
        ctx.restore()

      if @visuals.line.doit

        @visuals.line.set_vectorize(ctx, i)
        ctx.save()
        ctx.translate(@end[0][i], @end[1][i])
        ctx.rotate(-Math.PI/2 + angle)
        ctx.beginPath()
        ctx.moveTo(0,0)
        ctx.lineTo(100, -100)
        ctx.lineTo(-100, -100)
        ctx.closePath()
        ctx.stroke()
        ctx.restore()

class Arrow extends Annotation.Model
  default_view: ArrowView

  type: 'Arrow'

  @mixins ['line', 'fill']

  @define {
      x0:           [ p.NumberSpec,                     ]
      x1:           [ p.NumberSpec,                     ]
      # x_units:      [ p.SpatialUnits, 'data'            ]
      y0:           [ p.NumberSpec,                     ]
      y1:           [ p.NumberSpec,                     ]
      # y_units:      [ p.SpatialUnits, 'data'            ]
      source:       [ p.Instance                        ]
      x_range_name: [ p.String,      'default'          ]
      y_range_name: [ p.String,      'default'          ]
    }

  # defaults: ->
  #   return _.extend {}, super(), {
  #     #overrides
  #   }

module.exports =
  Model: Arrow
  View: ArrowView
