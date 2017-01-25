import * as rbush from "rbush"

import {Glyph, GlyphView} from "./glyph"
import {CategoricalMapper} from "../mappers/categorical_mapper"

export class XYGlyphView extends GlyphView

  _index_data: () ->
    index = rbush()
    pts = []

    # if the range is categorical, map to synthetic coordinates first
    if @renderer.xmapper instanceof CategoricalMapper
      xx = @renderer.xmapper.v_map_to_target(@_x, true)
    else
      xx = @_x
    if @renderer.ymapper instanceof CategoricalMapper
      yy = @renderer.ymapper.v_map_to_target(@_y, true)
    else
      yy = @_y

    for i in [0...xx.length]
      x = xx[i]
      if isNaN(x) or not isFinite(x)
        continue
      y = yy[i]
      if isNaN(y) or not isFinite(y)
        continue
      pts.push({minX: x, minY: y, maxX: x, maxY: y, i: i})

    index.load(pts)
    return index

export class XYGlyph extends Glyph
  type: "XYGlyph"
  default_view: XYGlyphView

  @coords [['x', 'y']]
