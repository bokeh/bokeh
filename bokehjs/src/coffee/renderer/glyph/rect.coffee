define [
  "underscore"
  "./glyph"
], (_, Glyph) ->

  class RectView extends Glyph.View

   _set_data: () ->
      @max_w2 = 0
      if @distances.width.units == "data"
        @max_w2 = @max_width/2
      @max_h2 = 0
      if @distances.height.units == "data"
        @max_h2 = @max_height/2

    _index_data: () ->
      @_xy_index()

    _map_data: () ->
      [sxi, syi] = @renderer.map_to_screen(@x, @y)

      @sw = @sdist(@renderer.xmapper, @x, @width, 'center', @mget('dilate'))
      @sh = @sdist(@renderer.ymapper, @y, @height, 'center', @mget('dilate'))
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

    _render: (ctx, indices, sx=@sx, sy=@sy, sw=@sw, sh=@sh) ->
      if @visuals.fill.do_fill
        for i in indices
          if isNaN(sx[i] + sy[i] + sw[i] + sh[i] + @angle[i])
            continue

          #no need to test the return value, we call fillRect for every glyph anyway
          @visuals.fill.set_vectorize(ctx, i)

          if @angle[i]
            ctx.translate(sx[i], sy[i])
            ctx.rotate(@angle[i])
            ctx.fillRect(-sw[i]/2, -sh[i]/2, sw[i], sh[i])
            ctx.rotate(-@angle[i])
            ctx.translate(-sx[i], -sy[i])
          else
            ctx.fillRect(sx[i]-sw[i]/2, sy[i]-sh[i]/2, sw[i], sh[i])

      if @visuals.line.do_stroke
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

          @visuals.line.set_vectorize(ctx, i)
          ctx.stroke()
          ctx.beginPath()

        ctx.stroke()

    _hit_rect: (geometry) ->
      [x0, x1] = @renderer.xmapper.v_map_from_target([geometry.vx0, geometry.vx1])
      [y0, y1] = @renderer.ymapper.v_map_from_target([geometry.vy0, geometry.vy1])

      return (x[4].i for x in @index.search([x0, y0, x1, y1]))

    _hit_point: (geometry) ->
      [vx, vy] = [geometry.vx, geometry.vy]
      x = @renderer.xmapper.map_from_target(vx)
      y = @renderer.ymapper.map_from_target(vy)

      # handle categorical cases
      xcat = _.isString(x)
      ycat = _.isString(y)

      if xcat or ycat
        candidates = (i for i in [0...@x.length])
      else
        # the dilation by a factor of two is a quick and easy way to make
        # sure we cover cases with rotated
        if @width_units == "screen" or xcat
          max_width = @max_width
          if xcat
            max_width = @renderer.xmapper.map_to_target(max_width)
          vx0 = vx - 2*max_width
          vx1 = vx + 2*max_width
          [x0, x1] = @renderer.xmapper.v_map_from_target([vx0, vx1])
        else
          x0 = x - 2*@max_width
          x1 = x + 2*@max_width

        if @height_units == "screen" or ycat
          max_height = @max_height
          if ycat
            max_height = @renderer.ymapper.map_to_target(max_height)
          vy0 = vy - 2*max_height
          vy1 = vy + 2*max_height
          [y0, y1] = @renderer.ymapper.v_map_from_target([vy0, vy1])
        else
          y0 = y - 2*@max_height
          y1 = y + 2*@max_height

        candidates = (pt[4].i for pt in @index.search([x0, y0, x1, y1]))

      hits = []
      for i in candidates
        if @width_units == "screen" or xcat
          sx = @renderer.plot_view.canvas.vx_to_sx(vx)
        else
          sx = @renderer.plot_view.canvas.vx_to_sx(@renderer.xmapper.map_to_target(x))

        if @height_units == "screen" or ycat
          sy = @renderer.plot_view.canvas.vy_to_sy(vy)
        else
          sy = @renderer.plot_view.canvas.vy_to_sy(@renderer.ymapper.map_to_target(y))

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

    _bounds: (bds) ->
      return [
        [bds[0][0]-@max_w2, bds[0][1]+@max_w2],
        [bds[1][1]-@max_h2, bds[1][1]+@max_h2]
      ]

  class Rect extends Glyph.Model
    default_view: RectView
    type: 'Rect'
    distances: ['width', 'height']
    angles: ['angle']

    display_defaults: ->
      return _.extend {}, super(), {
        angle: 0.0
        dilate: false
      }

  class Rects extends Glyph.Collection
    model: Rect

  return {
    Model: Rect
    View: RectView
    Collection: new Rects()
  }
