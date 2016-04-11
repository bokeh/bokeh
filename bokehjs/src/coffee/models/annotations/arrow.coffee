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
    @listenTo(@mget('source'), 'change', () ->
      set_data()
      @plot_view.request_render())

  set_data: () ->
    super(@mget('source'))
    @set_visuals(@mget('source'))

  _map_data: () ->
    if @mget('tail_units') == 'data'
      start = @plot_view.map_to_screen(@_tail_x, @_tail_y,
                                       x_name=@mget('x_range_name')
                                       y_name=@mget('y_range_name')
                                       )
    else
      start = [@canvas.v_vx_to_sx(@_tail_x.slice(0)),
               @canvas.v_vy_to_sy(@_tail_y.slice(0))]

    if @mget('head_units') == 'data'
      end = @plot_view.map_to_screen(@_head_x, @_head_y,
                                     x_name=@mget('x_range_name')
                                     y_name=@mget('y_range_name')
                                     )
    else
      end = [@canvas.v_vx_to_sx(@_head_x.slice(0)),
             @canvas.v_vy_to_sy(@_head_y.slice(0))]

    return [start, end]

  render: () ->
    [@start, @end] = @_map_data()
    @_draw_arrow_body()
    @_draw_arrow_head('head_', @start, @end)
    @_draw_arrow_head('tail_', @end, @start)

  _draw_arrow_body: () ->
    ctx = @plot_view.canvas_view.ctx

    ctx.save()
    for i in [0...@_tail_x.length]
        @visuals.body_line.set_vectorize(ctx, i)
        ctx.beginPath()
        ctx.moveTo(@start[0][i], @start[1][i])
        ctx.lineTo(@end[0][i], @end[1][i])

        if @visuals.body_line.doit
          ctx.stroke()
    ctx.restore()

  _draw_arrow_head: (prefix, start, end) ->
    ctx = @plot_view.canvas_view.ctx

    for i in [0...@_tail_x.length]

      # arrow head runs orthogonal to arrow body
      angle = Math.PI/2 + atan2([start[0][i], start[1][i]], [end[0][i], end[1][i]])

      ctx.save()
      ctx.translate(end[0][i], end[1][i])
      ctx.rotate(angle)

      switch @mget("#{prefix}style")
        when 'open'
          @_draw_head_open(prefix, ctx, i)
        when 'closed'
          @_draw_head_closed(prefix, ctx, i)
        else null

      ctx.restore()

  _draw_head_open: (prefix, ctx, i) ->
    if @visuals["#{prefix}border_line"].doit
      @visuals["#{prefix}border_line"].set_vectorize(ctx, i)
      ctx.beginPath()
      ctx.moveTo(0.5*@mget('head_size'), @mget('head_size'))
      ctx.lineTo(0, 0)
      ctx.lineTo(-0.5*@mget('head_size'), @mget('head_size'))
      ctx.stroke()

  _draw_head_closed: (prefix, ctx, i) ->
    if @visuals["#{prefix}body_fill"].doit
      @visuals["#{prefix}body_fill"].set_vectorize(ctx, i)
      ctx.beginPath()
      ctx.moveTo(0.5*@mget('head_size'), @mget('head_size'))
      ctx.lineTo(0, 0)
      ctx.lineTo(-0.5*@mget('head_size'), @mget('head_size'))
      ctx.closePath()
      ctx.fill()

    if @visuals["#{prefix}border_line"].doit
      @visuals["#{prefix}border_line"].set_vectorize(ctx, i)
      ctx.beginPath()
      ctx.moveTo(0.5*@mget('head_size'), @mget('head_size'))
      ctx.lineTo(0, 0)
      ctx.lineTo(-0.5*@mget('head_size'), @mget('head_size'))
      ctx.closePath()
      ctx.stroke()

class Arrow extends Annotation.Model
  default_view: ArrowView

  type: 'Arrow'

  @mixins ['line:body_', 'line:tail_border_', 'fill:tail_body_',
           'line:head_border_', 'fill:head_body_']

  @define {
      tail_x:           [ p.NumberSpec,                     ]
      tail_y:           [ p.NumberSpec,                     ]
      head_x:           [ p.NumberSpec,                     ]
      head_y:           [ p.NumberSpec,                     ]
      head_size:        [ p.Number,      25                 ]
      tail_units:       [ p.String,      'data'             ]
      head_units:       [ p.String,      'data'             ]
      head_style:       [ p.ArrowStyle,  'open'             ]
      tail_style:       [ p.ArrowStyle,  null               ]
      source:           [ p.Instance                        ]
      x_range_name:     [ p.String,      'default'          ]
      y_range_name:     [ p.String,      'default'          ]
    }

  defaults: ->
    return _.extend {}, super(), {
      #overrides
      tail_body_fill_color: "black"
      head_body_fill_color: "black"
    }

module.exports =
  Model: Arrow
  View: ArrowView
