define [
  "underscore"
  "./glyph"
], (_, Glyph) ->

  class ArcView extends Glyph.View

    _index_data: () ->
      @_xy_index()

    _map_data: () ->
      @sradius = @sdist(@renderer.xmapper, @x, @radius)

    _render: (ctx, indices, sx=@sx, sy=@sy, sradius=@sradius) ->
      if @visuals.line.do_stroke
        for i in indices
          if isNaN(sx[i] + sy[i] + sradius[i] + @start_angle[i] + @end_angle[i] + @direction[i])
            continue

          ctx.beginPath()
          ctx.arc(sx[i], sy[i], sradius[i], @start_angle[i], @end_angle[i], @direction[i])

          @visuals.line.set_vectorize(ctx, i)
          ctx.stroke()

    draw_legend: (ctx, x0, x1, y0, y1) ->
      reference_point = @get_reference_point() ? 0

      indices = [reference_point]
      sx = {}
      sx[reference_point] = (x0+x1)/2
      sy = {}
      sy[reference_point] = (y0+y1)/2

      sradius = {}
      sradius[reference_point] = Math.min(Math.abs(x1-x0), Math.abs(y1-y0))*0.4

      @_render(ctx, indices, sx, sy, sradius)

  class Arc extends Glyph.Model
    default_view: ArcView
    type: 'Arc'
    visuals: ['line']
    distances: ['radius']
    angles: ['start_angle', 'end_angle']
    fields: ['direction:direction']

    display_defaults: ->
      return _.extend {}, super(), {
        direction: 'anticlock'
      }

  class Arcs extends Glyph.Collection
    model: Arc

  return {
    Model: Arc
    View: ArcView
    Collection: new Arcs()
  }
