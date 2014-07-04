
define [
  "underscore",
  "rbush",
  "renderer/properties",
  "./glyph",
], (_, rbush, Properties, Glyph) ->

  class RectView extends Glyph.View

    _fields: ['x', 'y', 'width', 'height', 'angle']
    _properties: ['line', 'fill']

    _map_data: () ->
      [sxi, syi] = @plot_view.map_to_screen(@x, @glyph_props.x.units, @y, @glyph_props.y.units)

      @sw = @distance_vector('x', 'width', 'center', @mget('glyphspec')['dilate'])
      @sh = @distance_vector('y', 'height', 'center', @mget('glyphspec')['dilate'])
      @sx = new Array(sxi.length)
      @sy = new Array(sxi.length)
      for i in [0...sxi.length]
        if Math.abs(sxi[i]-@sw[i]) < 2
          @sx[i] = Math.round(sxi[i])
        else
          @sx[i] = sxi[i]
        if Math.abs(syi[i]-@sh[i]) < 2
          @sy[i] = Math.round(syi[i])
        else
          @sy[i] = syi[i]
      @max_width = _.max(@width)
      @max_height = _.max(@height)

    _set_data: () ->
      @index = rbush()
      pts = []
      for i in [0...@x.length]
        if not isNaN(@x[i] + @y[i])
          pts.push([@x[i], @y[i], @x[i], @y[i], {'i': i}])
      @index.load(pts)

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

      if glyph_props.line_properties.do_stroke

        ctx.beginPath()

        for i in indices

          if isNaN(sx[i] + sy[i] + sw[i] + sh[i] + @angle[i])
            continue

          # fillRect does not fill zero-height or -width rects, but rect(...)
          # does seem to stroke them (1px wide or tall). Explicitly ignore rects
          # with zero width or height to be consistent
          if sw[i]==0 or sh[i]==0
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

    _hit_rect: (geometry) ->
      [x0, x1] = @plot_view.xmapper.v_map_from_target([geometry.vx0, geometry.vx1])
      [y0, y1] = @plot_view.ymapper.v_map_from_target([geometry.vy0, geometry.vy1])

      return (x[4].i for x in @index.search([x0, y0, x1, y1]))

    _hit_point: (geometry) ->
      [vx, vy] = [geometry.vx, geometry.vy]
      x = @plot_view.xmapper.map_from_target(vx)
      y = @plot_view.ymapper.map_from_target(vy)

      # handle categorical cases
      xcat = (typeof(x) == "string")
      ycat = (typeof(y) == "string")

      if xcat or ycat
        candidates = (i for i in [0...@x.length])

      else
        # the dilation by a factor of two is a quick and easy way to make
        # sure we cover cases with rotated
        if @width_units == "screen" or xcat
          max_width = @max_width
          if xcat
            max_width = @plot_view.xmapper.map_to_target(max_width)
          vx0 = vx - 2*max_width
          vx1 = vx + 2*max_width
          [x0, x1] = @plot_view.xmapper.v_map_from_target([vx0, vx1])
        else
          x0 = x - 2*@max_width
          x1 = x + 2*@max_width

        if @height_units == "screen" or ycat
          max_height = @max_height
          if ycat
            max_height = @plot_view.ymapper.map_to_target(max_height)
          vy0 = vy - 2*max_height
          vy1 = vy + 2*max_height
          [y0, y1] = @plot_view.ymapper.v_map_from_target([vy0, vy1])
        else
          y0 = y - 2*@max_height
          y1 = y + 2*@max_height

        candidates = (pt[4].i for pt in @index.search([x0, y0, x1, y1]))

      hits = []
      for i in candidates
        if @width_units == "screen" or xcat
          sx = @plot_view.view_state.vx_to_sx(vx)
        else
          sx = @plot_view.view_state.vx_to_sx(@plot_view.xmapper.map_to_target(x))

        if @height_units == "screen" or ycat
          sy = @plot_view.view_state.vy_to_sy(vy)
        else
          sy = @plot_view.view_state.vy_to_sy(@plot_view.ymapper.map_to_target(y))

        if @angle[i]
          d = Math.sqrt(Math.pow((sx - @sx[i]), 2) + Math.pow((sy - @sy[i]),2))
          s = Math.sin(-@angle[i])
          c = Math.cos(-@angle[i])
          px = c * (sx-@sx[i]) - s * (sy-@sy[i]) + @sx[i]
          py = s * (sx-@sx[i]) + c * (sy-@sy[i]) + @sy[i]
          sx = px
          sy = py
        width_in = Math.abs(@sx[i]-sx) <= @sw[i]/2
        height_in = Math.abs(@sy[i]-sy) <= @sh[i]/2

        if height_in and width_in
          hits.push(i)

      return hits

    draw_legend: (ctx, x0, x1, y0, y1) ->
      @_generic_area_legend(ctx, x0, x1, y0, y1)


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
        dilate: false
      })

  return {
    "Model": Rect,
    "View": RectView,
  }
