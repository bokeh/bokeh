define [
  "underscore",
  "renderer/properties",
  "./glyph",
], (_, Properties, Glyph) ->

  class LineView extends Glyph.View

    _fields: ['x', 'y']
    _properties: ['line']

    _map_data: () ->
      [@sx, @sy] = @renderer.map_to_screen(@x, @glyph.x.units, @y, @glyph.y.units)

    _render: (ctx, indices) ->
      drawing = false
      @props.line.set(ctx, @props)

      for i in indices
        if !isFinite(@sx[i] + @sy[i]) and drawing
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

    _hit_point: (geometry) ->
      [vx, vy] = [geometry.vx, geometry.vy]
      sx = @renderer.plot_view.canvas.vx_to_sx(vx)

      nearest_ind = 0
      nearest_val = Math.abs sx-@sx[0]

      for i in [0...@sx.length]
        ival = Math.abs sx-@sx[i]

        if nearest_val>ival
          nearest_ind = i
          nearest_val = ival

      return [nearest_ind]

    _hit_span: (geometry) ->
      [vx, vy] = [geometry.vx, geometry.vy]

      if geometry.direction == 'v'
        yr = @renderer.yrange()
        y0 = yr.attributes.start
        y1 = yr.attributes.end
        [x0, x1] = @renderer.xmapper.v_map_from_target([vx, vx])
      else
        # TODO: Why is this returning the wrong bounds?
#        xr = @renderer.xrange()
#        xx0 = xr.attributes.start
#        xx1 = xr.attributes.end
        x0 = @x[0]
        x1 = @x[@x.length-1]

        [y0, y1] = @renderer.ymapper.v_map_from_target([vy, vy])

      results = []
      for i in [0...@x.length]
        res = @check_intersect(x0, y0, x1, y1, @x[i], @y[i], @x[i+1], @y[i+1])

        if res.hit == true
          res.index = i
          results.push(res)
      return results

    check_intersect: (l0_x0, l0_y0, l0_x1, l0_y1, l1_x0, l1_y0, l1_x1, l1_y1)->
      ### Check if 2 segments (l0 and l1) intersect. Returns a structure with
        the following attributes:

          * hit (boolean): whether the 2 segments intersect
          * x (float): x coordinate of the intersection point
          * y (float): y coordinate of the intersection point
      ###
      den = ((l1_y1 - l1_y0) * (l0_x1 - l0_x0)) - ((l1_x1 - l1_x0) * (l0_y1 - l0_y0))

      if den == 0
        return {hit: false, x: null, y: null}

      else
        a = l0_y0 - l1_y0
        b = l0_x0 - l1_x0
        num1 = ((l1_x1 - l1_x0) * a) - ((l1_y1 - l1_y0) * b)
        num2 = ((l0_x1 - l0_x0) * a) - ((l0_y1 - l0_y0) * b)
        a = num1 / den
        b = num2 / den
        x = l0_x0 + (a * (l0_x1 - l0_x0))
        y = l0_y0 + (a * (l0_y1 - l0_y0))

        return {
          hit: (a > 0 && a < 1) && (b > 0 && b < 1),
          x: x,
          y: y
        }

    draw_legend: (ctx, x0, x1, y0, y1) ->
      @_generic_line_legend(ctx, x0, x1, y0, y1)

  class Line extends Glyph.Model
    default_view: LineView
    type: 'Line'

    display_defaults: ->
      return _.extend {}, super(), @line_defaults

  class Lines extends Glyph.Collection
    model: Line

  return {
    Model: Line
    View: LineView
    Collection: new Lines()
  }
