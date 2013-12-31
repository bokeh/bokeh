
define [
  "underscore",
  "renderer/properties",
  "./glyph",
], (_, Properties, Glyph) ->

  class RectView extends Glyph.View

    _fields : ['x', 'y', 'width', 'height', 'angle']
    _properties: ['line', 'fill']

    _map_data: () ->
      [sxi, syi] = @plot_view.map_to_screen(@x, @glyph_props.x.units, @y, @glyph_props.y.units)
      @sw = @distance_vector('x', 'width', 'center')
      @sh = @distance_vector('y', 'height', 'center')
      @sx = new Array(sxi.length)
      @sy = new Array(sxi.length)
      for i in [0..sxi.length-1]
        if Math.abs(sxi[i]-@sw[i]) < 2
          @sx[i] = Math.round(sxi[i])
        else
          @sx[i] = sxi[i]
        if Math.abs(syi[i]-@sh[i]) < 2
          @sy[i] = Math.round(syi[i])
        else
          @sy[i] = syi[i]

    _render: (ctx, indices, glyph_props, sx=@sx, sy=@sy, sw=@sw, sh=@sh) ->
      if glyph_props.fill_properties.do_fill

        for i in indices

          if isNaN(sx[i] + sy[i] + sw[i] + sh[i] + @angle[i])
            continue

          #no need to test the return value, we call fillRect for every glyph anyway
          glyph_props.fill_properties.set_vectorize(ctx, i)

          if @angle[i]
            ctx.translate(sx[i], sy[i])
            ctx.rotate(@angle[i])
            ctx.fillRect(-sw[i]/2, -sh[i]/2, sw[i], sh[i])
            ctx.rotate(-@angle[i])
            ctx.translate(-sx[i], -sy[i])
          else
            ctx.fillRect(sx[i]-sw[i]/2, sy[i]-sh[i]/2, sw[i], sh[i])
            ctx.rect(sx[i]-sw[i]/2, sy[i]-sh[i]/2, sw[i], sh[i])

      if glyph_props.line_properties.do_stroke

        ctx.beginPath()

        for i in indices

          if isNaN(sx[i] + sy[i] + sw[i] + sh[i] + @angle[i])
            continue

          if @angle[i]
            ctx.translate(sx[i], sy[i])
            ctx.rotate(@angle[i])
            ctx.rect(-sw[i]/2, -sh[i]/2, sw[i], sh[i])
            ctx.rotate(-@angle[i])
            ctx.translate(-sx[i], -sy[i])
          else
            ctx.rect(sx[i]-sw[i]/2, sy[i]-sh[i]/2, sw[i], sh[i])

          glyph_props.line_properties.set_vectorize(ctx, i)
          ctx.stroke()
          ctx.beginPath()

        ctx.stroke()

    draw_legend: (ctx, x0, x1, y0, y1) ->
      reference_point = @get_reference_point() ? 0

      indices = [reference_point]
      sx = { }
      sx[reference_point] = (x0+x1)/2
      sy = { }
      sy[reference_point] = (y0+y1)/2

      scale = @sw[reference_point] / @sh[reference_point]
      d = Math.min(Math.abs(x1-x0), Math.abs(y1-y0)) * 0.8
      sw = { }
      sh = { }
      if scale > 1
        sw[reference_point] = d
        sh[reference_point] = d/scale
      else
        sw[reference_point] = d*scale
        sh[reference_point] = d

      @_render(ctx, indices, @glyph_props, sx, sy, sw, sh)

  class Rect extends Glyph.Model
    default_view: RectView
    type: 'Glyph'

    display_defaults: () ->
      return _.extend(super(), {
        fill_color: 'gray'
        fill_alpha: 1.0
        line_color: 'red'
        line_width: 1
        line_alpha: 1.0
        line_join: 'miter'
        line_cap: 'butt'
        line_dash: []
        line_dash_offset: 0
        angle: 0.0
      })

  return {
    "Model": Rect,
    "View": RectView,
  }
