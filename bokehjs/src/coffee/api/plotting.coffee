api = require("../api")

class Figure

  _glyph_function: (cls, args) ->
    return new api.GlyphRenderer()

  annular_wedge:     () -> return @_glyph_function(api.AnnularWedge,     arguments.slice(0))
  annulus:           () -> return @_glyph_function(api.Annulus,          arguments.slice(0))
  arc:               () -> return @_glyph_function(api.Arc,              arguments.slice(0))
  bezier:            () -> return @_glyph_function(api.Bezier,           arguments.slice(0))
  gear:              () -> return @_glyph_function(api.Gear,             arguments.slice(0))
  image:             () -> return @_glyph_function(api.Image,            arguments.slice(0))
  image_rgba:        () -> return @_glyph_function(api.ImageRGBA,        arguments.slice(0))
  image_url:         () -> return @_glyph_function(api.ImageURL,         arguments.slice(0))
  line:              () -> return @_glyph_function(api.Line,             arguments.slice(0))
  multi_line:        () -> return @_glyph_function(api.MultiLine,        arguments.slice(0))
  oval:              () -> return @_glyph_function(api.Oval,             arguments.slice(0))
  patch:             () -> return @_glyph_function(api.Patch,            arguments.slice(0))
  patches:           () -> return @_glyph_function(api.Patches,          arguments.slice(0))
  quad:              () -> return @_glyph_function(api.Quad,             arguments.slice(0))
  quadratic:         () -> return @_glyph_function(api.Quadratic,        arguments.slice(0))
  ray:               () -> return @_glyph_function(api.Ray,              arguments.slice(0))
  rect:              () -> return @_glyph_function(api.Rect,             arguments.slice(0))
  segment:           () -> return @_glyph_function(api.Segment,          arguments.slice(0))
  text:              () -> return @_glyph_function(api.Text,             arguments.slice(0))
  wedge:             () -> return @_glyph_function(api.Wedge,            arguments.slice(0))

  asterisk:          () -> return @_glyph_function(api.Asterisk,         arguments.slice(0))
  circle:            () -> return @_glyph_function(api.Circle,           arguments.slice(0))
  circle_cross:      () -> return @_glyph_function(api.CircleCross,      arguments.slice(0))
  circle_x:          () -> return @_glyph_function(api.CircleX,          arguments.slice(0))
  cross:             () -> return @_glyph_function(api.Cross,            arguments.slice(0))
  diamond:           () -> return @_glyph_function(api.Diamond,          arguments.slice(0))
  diamond_cross:     () -> return @_glyph_function(api.DiamondCross,     arguments.slice(0))
  inverted_triangle: () -> return @_glyph_function(api.InvertedTriangle, arguments.slice(0))
  square:            () -> return @_glyph_function(api.Square,           arguments.slice(0))
  square_cross:      () -> return @_glyph_function(api.SquareCross,      arguments.slice(0))
  square_x:          () -> return @_glyph_function(api.SquareX,          arguments.slice(0))
  triangle:          () -> return @_glyph_function(api.Triangle,         arguments.slice(0))
  x:                 () -> return @_glyph_function(api.X,                arguments.slice(0))

figure = (attrs) -> return new Figure(attrs)

module.exports = {
  Figure: Figure
  figure: figure
}
