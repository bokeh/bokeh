define [
  "underscore",
  "renderer/properties",
  "./glyph",
], (_, Properties, Glyph) ->

  class OvalView extends Glyph.View

    _fields: ['x', 'y', 'width', 'height', 'angle']
    _properties: ['line', 'fill']

    _map_data: () ->
      [@sx, @sy] = @renderer.map_to_screen(@x, @glyph.x.units, @y, @glyph.y.units)
      @sw = @distance_vector('x', 'width', 'center')
      @sh = @distance_vector('y', 'height', 'center')

    _render: (ctx, indices, sx=@sx, sy=@sy, sw=@sw, sh=@sh) ->
      for i in indices
        if isNaN(sx[i] + sy[i] + sw[i] + sh[i] + @angle[i])
          continue

        ctx.translate(sx[i], sy[i])
        ctx.rotate(@angle[i])

        ctx.beginPath()
        ctx.moveTo(0, -sh[i]/2)
        ctx.bezierCurveTo( sw[i]/2, -sh[i]/2,  sw[i]/2,  sh[i]/2, 0,  sh[i]/2);
        ctx.bezierCurveTo(-sw[i]/2,  sh[i]/2, -sw[i]/2, -sh[i]/2, 0, -sh[i]/2);
        ctx.closePath()

        if @props.fill.do_fill
          @props.fill.set_vectorize(ctx, i)
          ctx.fill()

        if @props.line.do_stroke
          @props.line.set_vectorize(ctx, i)
          ctx.stroke()

        ctx.rotate(-@angle[i])
        ctx.translate(-sx[i], -sy[i])

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

      @_render(ctx, indices, sx, sy, sw, sh)

  class Oval extends Glyph.Model
    default_view: OvalView
    type: 'Oval'

    display_defaults: ->
      return _.extend {}, super(), @line_defaults, @fill_defaults, {
        angle: 0.0
      }

  class Ovals extends Glyph.Collection
    model: Oval

  return {
    Model: Oval
    View: OvalView
    Collection: new Ovals()
  }
