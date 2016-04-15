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
    if @mget('start_units') == 'data'
      start = @plot_view.map_to_screen(@_x_start, @_y_start,
                                       x_name=@mget('x_range_name')
                                       y_name=@mget('y_range_name')
                                       )
    else
      start = [@canvas.v_vx_to_sx(@_x_start.slice(0)),
               @canvas.v_vy_to_sy(@_y_start.slice(0))]

    if @mget('end_units') == 'data'
      end = @plot_view.map_to_screen(@_x_end, @_y_end,
                                     x_name=@mget('x_range_name')
                                     y_name=@mget('y_range_name')
                                     )
    else
      end = [@canvas.v_vx_to_sx(@_x_end.slice(0)),
             @canvas.v_vy_to_sy(@_y_end.slice(0))]

    return [start, end]

  render: () ->
    [@start, @end] = @_map_data()
    @_draw_arrow_body()
    @_draw_arrow_head('end', @start, @end)
    @_draw_arrow_head('start', @end, @start)

  _draw_arrow_body: () ->
    ctx = @plot_view.canvas_view.ctx

    ctx.save()
    for i in [0...@_x_start.length]
        @visuals.line.set_vectorize(ctx, i)
        ctx.beginPath()
        ctx.moveTo(@start[0][i], @start[1][i])
        ctx.lineTo(@end[0][i], @end[1][i])

        if @visuals.line.doit
          ctx.stroke()
    ctx.restore()

  _draw_arrow_head: (prefix, start, end) ->
    ctx = @plot_view.canvas_view.ctx

    for i in [0...@_x_start.length]

      # arrow head runs orthogonal to arrow body
      angle = Math.PI/2 + atan2([start[0][i], start[1][i]], [end[0][i], end[1][i]])

      ctx.save()
      ctx.translate(end[0][i], end[1][i])
      ctx.rotate(angle)

      switch @mget("#{prefix}_style")
        when 'open'
          @_draw_head_open(prefix, ctx, i)
        when 'normal'
          @_draw_head_closed(prefix, ctx, i)
        when 'vee'
          @_draw_head_vee(prefix, ctx, i)
        else null

      ctx.restore()

  _draw_head_open: (prefix, ctx, i) ->
    if @visuals["#{prefix}_line"].doit
      @visuals["#{prefix}_line"].set_vectorize(ctx, i)
      ctx.beginPath()
      ctx.moveTo(0.5*@mget("#{prefix}_size"), @mget("#{prefix}_size"))
      ctx.lineTo(0, 0)
      ctx.lineTo(-0.5*@mget("#{prefix}_size"), @mget("#{prefix}_size"))
      ctx.stroke()

  _draw_head_closed: (prefix, ctx, i) ->
    if @visuals["#{prefix}_fill"].doit
      @visuals["#{prefix}_fill"].set_vectorize(ctx, i)
      ctx.beginPath()
      ctx.moveTo(0.5*@mget("#{prefix}_size"), @mget("#{prefix}_size"))
      ctx.lineTo(0, 0)
      ctx.lineTo(-0.5*@mget("#{prefix}_size"), @mget("#{prefix}_size"))
      ctx.closePath()
      ctx.fill()

    if @visuals["#{prefix}_line"].doit
      @visuals["#{prefix}_line"].set_vectorize(ctx, i)
      ctx.beginPath()
      ctx.moveTo(0.5*@mget("#{prefix}_size"), @mget("#{prefix}_size"))
      ctx.lineTo(0, 0)
      ctx.lineTo(-0.5*@mget("#{prefix}_size"), @mget("#{prefix}_size"))
      ctx.closePath()
      ctx.stroke()

  _draw_head_vee: (prefix, ctx, i) ->
    if @visuals["#{prefix}_fill"].doit
      @visuals["#{prefix}_fill"].set_vectorize(ctx, i)
      ctx.beginPath()
      ctx.moveTo(0.5*@mget("#{prefix}_size"), @mget("#{prefix}_size"))
      ctx.lineTo(0, 0)
      ctx.lineTo(-0.5*@mget("#{prefix}_size"), @mget("#{prefix}_size"))
      ctx.lineTo(0, 0.5*@mget("#{prefix}_size"))
      ctx.closePath()
      ctx.fill()

    if @visuals["#{prefix}_line"].doit
      @visuals["#{prefix}_line"].set_vectorize(ctx, i)
      ctx.beginPath()
      ctx.moveTo(0.5*@mget("#{prefix}_size"), @mget("#{prefix}_size"))
      ctx.lineTo(0, 0)
      ctx.lineTo(-0.5*@mget("#{prefix}_size"), @mget("#{prefix}_size"))
      ctx.lineTo(0, 0.5*@mget("#{prefix}_size"))
      ctx.closePath()
      ctx.stroke()

class Arrow extends Annotation.Model
  default_view: ArrowView

  type: 'Arrow'

  @mixins ['line', 'line:start_', 'fill:start_',
           'line:end_', 'fill:end_']

  @define {
      x_start:          [ p.NumberSpec,                     ]
      y_start:          [ p.NumberSpec,                     ]
      start_units:      [ p.String,      'data'             ]
      start_style:      [ p.ArrowStyle,  null               ]
      start_size:       [ p.Number,      25                 ]
      x_end:            [ p.NumberSpec,                     ]
      y_end:            [ p.NumberSpec,                     ]
      end_units:        [ p.String,      'data'             ]
      end_style:        [ p.ArrowStyle,  'open'             ]
      end_size:         [ p.Number,      25                 ]
      source:           [ p.Instance                        ]
      x_range_name:     [ p.String,      'default'          ]
      y_range_name:     [ p.String,      'default'          ]
    }

  @override {
      start_fill_color: "black"
      end_fill_color: "black"
    }

module.exports =
  Model: Arrow
  View: ArrowView
