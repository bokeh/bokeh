_ = require "underscore"

Glyph = require "./glyph"

class PatchView extends Glyph.View

  _index_data: () ->
    @_xy_index()

  _render: (ctx, indices, {sx, sy}) ->
    if @visuals.fill.doit
      @visuals.fill.set_value(ctx)

      for i in indices
        if i == 0
          ctx.beginPath()
          ctx.moveTo(sx[i], sy[i])
          continue
        else if isNaN(sx[i] + sy[i])
          ctx.closePath()
          ctx.fill()
          ctx.beginPath()
          continue
        else
          ctx.lineTo(sx[i], sy[i])

      ctx.closePath()
      ctx.fill()

    if @visuals.line.doit
      @visuals.line.set_value(ctx)

      for i in indices
        if i == 0
          ctx.beginPath()
          ctx.moveTo(sx[i], sy[i])
          continue
        else if isNaN(sx[i] + sy[i])
          ctx.closePath()
          ctx.stroke()
          ctx.beginPath()
          continue
        else
          ctx.lineTo(sx[i], sy[i])

      ctx.closePath()
      ctx.stroke()

  draw_legend: (ctx, x0, x1, y0, y1) ->
    @_generic_area_legend(ctx, x0, x1, y0, y1)

class Patch extends Glyph.Model
  default_view: PatchView

  type: 'Patch'

  @coords [['x', 'y']]
  @mixins ['line', 'fill']

module.exports =
  Model: Patch
  View: PatchView
