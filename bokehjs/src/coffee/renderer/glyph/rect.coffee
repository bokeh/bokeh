
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

    _render: (ctx, glyph_props, use_selection) ->
      if glyph_props.fill_properties.do_fill
        for i in [0..@sx.length-1]
          if isNaN(@sx[i] + @sy[i] + @sw[i] + @sh[i] + @angle[i])
            continue
          if use_selection == true and not @selected_mask[i]
            continue
          if use_selection == false and @selected_mask[i]
            continue

          #no need to test the return value, we call fillRect for every glyph anyway
          glyph_props.fill_properties.set_vectorize(ctx, i)

          if @angle[i]
            ctx.translate(@sx[i], @sy[i])
            ctx.rotate(@angle[i])
            ctx.fillRect(-@sw[i]/2, -@sh[i]/2, @sw[i], @sh[i])
            ctx.rotate(-@angle[i])
            ctx.translate(-@sx[i], -@sy[i])
          else
            ctx.fillRect(@sx[i]-@sw[i]/2, @sy[i]-@sh[i]/2, @sw[i], @sh[i])
            ctx.rect(@sx[i]-@sw[i]/2, @sy[i]-@sh[i]/2, @sw[i], @sh[i])

      if glyph_props.line_properties.do_stroke

        ctx.beginPath()

        for i in [0..@sx.length-1]

          if isNaN(@sx[i] + @sy[i] + @sw[i] + @sh[i] + @angle[i])
            continue
          if use_selection == true and not @selected_mask[i]
            continue
          if use_selection == false and @selected_mask[i]
            continue

          if @angle[i]
            ctx.translate(@sx[i], @sy[i])
            ctx.rotate(@angle[i])
            ctx.rect(-@sw[i]/2, -@sh[i]/2, @sw[i], @sh[i])
            ctx.rotate(-@angle[i])
            ctx.translate(-@sx[i], -@sy[i])
          else
            ctx.rect(@sx[i]-@sw[i]/2, @sy[i]-@sh[i]/2, @sw[i], @sh[i])

          # only stroke if the line_properties have changed
          if glyph_props.line_properties.set_vectorize(ctx, i)
            ctx.stroke()
            ctx.beginPath()

        ctx.stroke()

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
        data_w = @distance([reference_point], 'x', 'width', 'center')[0]
        data_h = @distance([reference_point], 'y', 'height', 'center')[0]
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
      fill_props.set(ctx, glyph_settings)
      ctx.fill()
      line_props.set(ctx, glyph_settings)
      ctx.stroke()

      ctx.restore()

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
