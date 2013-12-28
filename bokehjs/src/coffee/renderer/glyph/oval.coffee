

define [
  "underscore",
  "renderer/properties",
  "./glyph",
], (_, Properties, Glyph) ->

  class OvalView extends Glyph.View

    _fields: ['x', 'y', 'width', 'height', 'angle']
    _properties: ['line', 'fill']

    _map_data: () ->
      [@sx, @sy] = @plot_view.map_to_screen(@x, @glyph_props.x.units, @y, @glyph_props.y.units)
      @sw = @distance_vector('x', 'width', 'center')
      @sh = @distance_vector('y', 'height', 'center')

    _render: (ctx, indices, glyph_props) ->
      for i in indices

        if isNaN(@sx[i] + @sy[i] + @sw[i] + @sh[i] + @angle[i])
          continue

        ctx.translate(@sx[i], @sy[i])
        ctx.rotate(@angle[i])

        ctx.beginPath()
        ctx.moveTo(0, -@sh[i]/2)
        ctx.bezierCurveTo( @sw[i]/2, -@sh[i]/2,  @sw[i]/2,  @sh[i]/2, 0,  @sh[i]/2);
        ctx.bezierCurveTo(-@sw[i]/2,  @sh[i]/2, -@sw[i]/2, -@sh[i]/2, 0, -@sh[i]/2);
        ctx.closePath()

        if glyph_props.fill_properties.do_fill
          glyph_props.fill_properties.set_vectorize(ctx, i)
          ctx.fill()

        if glyph_props.line_properties.do_stroke
          glyph_props.line_properties.set_vectorize(ctx, i)
          ctx.stroke()

        ctx.rotate(-@angle[i])
        ctx.translate(-@sx[i], -@sy[i])

    draw_legend: (ctx, x1, x2, y1, y2) ->
      glyph_props = @glyph_props
      line_props = glyph_props.line_properties
      fill_props = glyph_props.fill_properties
      ctx.save()
      reference_point = @get_reference_point()
      if reference_point?
        glyph_settings = reference_point
        sw = @distance([reference_point], 'x', 'width', 'center')[0]
        sh = @distance([reference_point], 'y', 'height', 'center')[0]
      else
        glyph_settings = glyph_props
        sw = 1.0
        sh = 2.0
      border = line_props.select(line_props.line_width_name, glyph_settings)
      w = Math.abs(x2-x1)
      h = Math.abs(y2-y1)
      w = w - 2*border
      h = h - 2*border
      ratio1 = h / sh
      ratio2 = w / sw
      ratio = _.min([ratio1, ratio2])
      h = sh * ratio
      w = sw * ratio

      ctx.translate((x1 + x2)/2, (y1 + y2)/2)
      ctx.beginPath()
      ctx.moveTo(0, -h/2)
      ctx.bezierCurveTo( w/2, -h/2,  w/2,  h/2, 0,  h/2)
      ctx.bezierCurveTo( -w/2, h/2,  -w/2,  -h/2, 0,  -h/2)
      ctx.closePath()
      if fill_props.do_fill
        fill_props.set(ctx, glyph_settings)
        ctx.fill()
      if line_props.do_stroke
        line_props.set(ctx, glyph_settings)
        ctx.stroke()

      ctx.restore()

  class Oval extends Glyph.Model
    default_view: OvalView
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
    "Model": Oval,
    "View": OvalView,
  }
