define [
  "underscore",
  "renderer/properties",
  "./glyph",
], (_, Properties, Glyph) ->

  class ArcView extends Glyph.View

    _fields: ['x', 'y', 'radius', 'start_angle', 'end_angle', 'direction:string']
    _properties: ['line']

    _map_data: () ->
      [@sx, @sy] = @renderer.map_to_screen(@x, @glyph.x.units, @y, @glyph.y.units)
      @radius = @distance_vector('x', 'radius', 'edge')

    _render: (ctx, indices, sx=@sx, sy=@sy, radius=@radius) ->
      if @props.line.do_stroke
        for i in indices
          if isNaN(sx[i] + sy[i] + radius[i] + @start_angle[i] + @end_angle[i] + @direction[i])
            continue

          ctx.beginPath()
          ctx.arc(sx[i], sy[i], radius[i], @start_angle[i], @end_angle[i], @direction[i])

          @props.line.set_vectorize(ctx, i)
          ctx.stroke()

    draw_legend: (ctx, x0, x1, y0, y1) ->
      reference_point = @get_reference_point() ? 0

      indices = [reference_point]
      sx = {}
      sx[reference_point] = (x0+x1)/2
      sy = {}
      sy[reference_point] = (y0+y1)/2

      radius = {}
      radius[reference_point] = Math.min(Math.abs(x1-x0), Math.abs(y1-y0))*0.4

      @_render(ctx, indices, sx, sy, radius)

  class Arc extends Glyph.Model
    default_view: ArcView
    type: 'Arc'

    display_defaults: ->
      return _.extend {}, super(), @line_defaults, {
        direction: 'anticlock'
      }

  class Arcs extends Glyph.Collection
    model: Arc

  return {
    Model: Arc
    View: ArcView
    Collection: new Arcs()
  }
