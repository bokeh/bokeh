
define (require, exports, module) ->

  _ = require("underscore")
  HasParent = require("common/has_parent")
  PlotWidget = require("common/plot_widget")

  glyphs = {
    annular_wedge     : require("./annular_wedge").Model
    annulus           : require("./annulus").Model
    arc               : require("./arc").Model
    asterisk          : require("./asterisk").Model
    bezier            : require("./bezier").Model
    circle            : require("./circle").Model
    circle_x          : require("./circle_x").Model
    circle_cross      : require("./circle_cross").Model
    diamond           : require("./diamond").Model
    diamond_cross     : require("./diamond_cross").Model
    gear              : require("./gear").Model
    image             : require("./image").Model
    image_rgba        : require("./image_rgba").Model
    image_url         : require("./image_url").Model
    inverted_triangle : require("./inverted_triangle").Model
    line              : require("./line").Model
    multi_line        : require("./multi_line").Model
    oval              : require("./oval").Model
    patch             : require("./patch").Model
    patches           : require("./patches").Model
    cross             : require("./cross").Model
    quad              : require("./quad").Model
    quadratic         : require("./quadratic").Model
    ray               : require("./ray").Model
    rect              : require("./rect").Model
    square            : require("./square").Model
    square_x          : require("./square_x").Model
    square_cross      : require("./square_cross").Model
    segment           : require("./segment").Model
    text              : require("./text").Model
    triangle          : require("./triangle").Model
    wedge             : require("./wedge").Model
    x                 : require("./x").Model
  }

  class Glyph extends Backbone.Collection
    model: (attrs, options) ->

      if not attrs.glyphspec?.type?
        console.log "missing glyph type"
        return

      type = attrs.glyphspec.type

      if not (type of glyphs)
        console.log "unknown glyph type '" + type + "'"
        return

      model = glyphs[type]
      return new model(attrs, options)

  return {
    "Collection": new Glyph(),
  }
