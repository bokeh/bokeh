
define [
  "underscore",
  "renderer/properties",
  "./glyph",
], (_, Properties, Glyph) ->

  class LineView extends Glyph.View
    initialize : (options) ->
      super(options)
      if @mget_obj('server_data_source')
        @setup_server_data()
      @listenTo(this, 'change:server_data_source', () =>
        if @server_source
          @server_source.stoplistening_for_updates(@mget_obj('data_source'))
          @setup_server_data()
      )

    setup_server_data : () ->
      server_source = @mget_obj('server_data_source')
      @server_source = server_source
      #need to parameterize these some how, assume domain=x for now
      domain = 'x'
      if domain == 'x'
        server_source.listen_for_line1d_updates(@mget_obj('data_source'),
          @plot_view.x_range,
          @plot_view.view_state.get('inner_range_horizontal'),
          @glyph_props.y.field,
          @glyph_props.x.field,
          [@glyph_props.y.field]
        )
    _fields: ['x', 'y']
    _properties: ['line']

    _map_data: () ->
      [@sx, @sy] = @plot_view.map_to_screen(@x, @glyph_props.x.units, @y, @glyph_props.y.units)

    _render: (ctx, indices, glyph_props) ->

      drawing = false
      glyph_props.line_properties.set(ctx, glyph_props)

      for i in indices

        if isNaN(@sx[i] + @sy[i]) and drawing
          ctx.stroke()
          ctx.beginPath()
          drawing = false
          continue

        if drawing
          ctx.lineTo(@sx[i], @sy[i])
        else
          ctx.beginPath()
          ctx.moveTo(@sx[i], @sy[i])
          drawing = true

      if drawing
        ctx.stroke()

    draw_legend: (ctx, x0, x1, y0, y1) ->
      @_generic_line_legend(ctx, x0, x1, y0, y1)

  class Line extends Glyph.Model
    default_view: LineView
    type: 'Glyph'

    display_defaults: () ->
      return _.extend(super(), {
        line_color: 'red'
        line_width: 1
        line_alpha: 1.0
        line_join: 'miter'
        line_cap: 'butt'
        line_dash: []
        line_dash_offset: 0
      })

  return {
    "Model": Line,
    "View": LineView,
  }
