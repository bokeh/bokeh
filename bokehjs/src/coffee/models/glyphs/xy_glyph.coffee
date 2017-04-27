import {RBush} from "core/util/spatial"
import {Glyph, GlyphView} from "./glyph"
import {CategoricalScale} from "../scales/categorical_scale"

export class XYGlyphView extends GlyphView

  _index_data: () ->
    # if the range is categorical, map to synthetic coordinates first
    if @renderer.xmapper instanceof CategoricalScale
      xx = @renderer.xmapper.v_map_to_target(@_x, true)
    else
      xx = @_x
    if @renderer.ymapper instanceof CategoricalScale
      yy = @renderer.ymapper.v_map_to_target(@_y, true)
    else
      yy = @_y

    points = []
    for i in [0...xx.length]
      x = xx[i]
      if isNaN(x) or not isFinite(x)
        continue
      y = yy[i]
      if isNaN(y) or not isFinite(y)
        continue
      points.push({minX: x, minY: y, maxX: x, maxY: y, i: i})

    return new RBush(points)

export class XYGlyph extends Glyph
  type: "XYGlyph"
  default_view: XYGlyphView

  @coords [['x', 'y']]
