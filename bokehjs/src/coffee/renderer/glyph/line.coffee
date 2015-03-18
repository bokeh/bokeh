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
      ### Check if the point geometry hits this line glyph and return an object
      that describes the hit result:

        Args:
          * geometry (object): object with the following keys
            * vx (float): view x coordinate of the point
            * vy (float): view y coordinate of the point
            * type (str): type of geometry (in this case it's a point)

        Output:
          Object with the following keys:
            * 0d (bool): whether the point hits the glyph or not
            * 1d (array(int)): array with the indices hit by the point

      ###
      [vx, vy] = [geometry.vx, geometry.vy]
      x = @renderer.xmapper.map_from_target(vx)
      y = @renderer.ymapper.map_from_target(vy)
      [x0, x1] = [x-1, x+1]
      [y0, y1] = [y-1, y+1]

      result = {
        '0d': false,
        '1d': []
      }

      for i in [0...@x.length-1]
        console.log x0, y0, x1, y1, @x[i], @y[i], @x[i+1], @y[i+1]
        res = @check_intersect(x0, y0, x1, y1, @x[i], @y[i], @x[i+1], @y[i+1])

        if res.hit == true
          result['0d'] = true
          result['1d'].push(i)

      return result

    _hit_span: (geometry) ->
      [vx, vy] = [geometry.vx, geometry.vy]

      result = {
        '0d': false,
        '1d': []
      }

      if geometry.direction == 'h'
        y = @renderer.ymapper.map_from_target(vy)
        for i in [0...@y.length-1]
          if @y[i]<=y<=@y[i+1]

            result['0d'] = true
            result['1d'].push(i)
      else
        x = @renderer.xmapper.map_from_target(vx)
        for i in [0...@x.length-1]
          if @x[i]<=x<=@x[i+1]
            result['0d'] = true
            if Math.abs @x[i]-x <= Math.abs @x[i+1]-x
              result['1d'].push(i)
            else
              result['1d'].push(i+1)

      return result

    check_interpolation_hit: (i, geometry)->
      [vx, vy] = [geometry.vx, geometry.vy]
      [x2, y2, x3, y3] = [@x[i], @y[i], @x[i+1], @y[i+1]]
      x = @renderer.xmapper.map_from_target(vx)
      y = @renderer.ymapper.map_from_target(vy)

      if geometry.type == 'point'
        [x0, x1] = [x-1, x+1]
        [y0, y1] = [y-1, y+1]
      else
        if geometry.direction == 'h'
          xr = @renderer.xrange()
          vx0 = xr.get('start')
          vx1 = xr.get('end')
          [vy0, vy1] = [vy, vy]

          if @y[i]>vy
            [x3, y3] = [@x[i-1], @y[i-1]]
        else
          yr = @renderer.yrange()
          vy0 = yr.get('start')
          vy1 = yr.get('end')
          [vx0, vx1] = [vx, vx]

          if @x[i]>vx
            [x3, y3] = [@x[i-1], @y[i-1]]

        [x0, x1] = @renderer.xmapper.v_map_from_target([vx0, vx1])
        [y0, y1] = @renderer.ymapper.v_map_from_target([vy0, vy1])

      return @check_intersect(x0, y0, x1, y1, x2, y2, x3, y3)

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
