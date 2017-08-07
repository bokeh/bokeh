import {RBush} from "core/util/spatial"
import {Glyph, GlyphView} from "./glyph"

export class XYGlyphView extends GlyphView

  _index_data: () ->
    points = []

    for i in [0...@_x.length]
      x = @_x[i]
      y = @_y[i]
      if isNaN(x+y) or not isFinite(x+y)
        continue
      points.push({minX: x, minY: y, maxX: x, maxY: y, i: i})

    return new RBush(points)

export class XYGlyph extends Glyph
  type: "XYGlyph"
  default_view: XYGlyphView

  @coords [['x', 'y']]
