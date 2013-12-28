
define [
  "underscore",
  "renderer/properties",
  "./marker",
], (_, Properties, Marker) ->

  class SquareXView extends Marker.View

    _properties: ['line', 'fill']

    _map_data: () ->
      [@sx, @sy] = @plot_view.map_to_screen(@x, @glyph_props.x.units, @y, @glyph_props.y.units)
      @size = @distance_vector('x', 'size', 'center')

    _render: (ctx, indices, glyph_props) ->
      for i in indices

        if isNaN(@sx[i] + @sy[i] + @size[i])
          continue

        ctx.translate(@sx[i], @sy[i])

        ctx.beginPath()
        ctx.rect(-@size[i]/2, -@size[i]/2, @size[i], @size[i])

        if glyph_props.fill_properties.do_fill
          glyph_props.fill_properties.set_vectorize(ctx, i)
          ctx.fill()

        if glyph_props.line_properties.do_stroke
          glyph_props.line_properties.set_vectorize(ctx, i)
          ctx.stroke()
          r = @size[i]/2
          ctx.moveTo(-r, +r)
          ctx.lineTo(+r, -r)
          ctx.moveTo(-r, -r)
          ctx.lineTo(+r, +r)
          ctx.stroke()

        ctx.translate(-@sx[i], -@sy[i])

    draw_legend: (ctx, x1, x2, y1, y2) ->
      ## dummy legend function just draws a circle.. this way
      ## even if we have a differnet glyph shape, at least we get the
      ## right colors present
      glyph_props = @glyph_props
      line_props = glyph_props.line_properties
      fill_props = glyph_props.fill_properties
      ctx.save()

      reference_point = @get_reference_point()
      if reference_point?
        glyph_settings = reference_point
        data_w = @distance([reference_point], 'x', 'size', 'center')[0]
        data_h = data_w
      else
        glyph_settings = glyph_props
      border = line_props.select(line_props.line_width_name, glyph_settings)

      ctx.beginPath()
      w = Math.abs(x2-x1)
      h = Math.abs(y2-y1)
      w = w - 2*border
      h = h - 2*border
      if data_w?
        w = if data_w > w then w else data_w
      if data_h?
        h = if data_h > h then h else data_h
      x = (x1 + x2) / 2 - (w / 2)
      y = (y1 + y2) / 2 - (h / 2)
      ctx.rect(x, y, w, h)
      if fill_props.do_fill
        fill_props.set(ctx, glyph_settings)
        ctx.fill()
      if line_props.do_stroke
        line_props.set(ctx, glyph_settings)
        ctx.moveTo(x-r, y+r)
        ctx.lineTo(x+r, y-r)
        ctx.moveTo(x-r, y-r)
        ctx.lineTo(x+r, y+r)
        ctx.stroke()

      ctx.restore()

  class SquareX extends Marker.Model
    default_view: SquareXView
    type: 'Glyph'

    display_defaults: () ->
      return _.extend(super(), {
        size_units: 'screen'

        fill_color: 'gray'
        fill_alpha: 1.0

        line_color: 'red'
        line_width: 1
        line_alpha: 1.0
        line_join: 'miter'
        line_cap: 'butt'
        line_dash: []
        line_dash_offset: 0
      })

  return {
    "Model": SquareX,
    "View": SquareXView,
  }

