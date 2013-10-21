
properties = require('../properties')
glyph_properties = properties.glyph_properties
line_properties = properties.line_properties
fill_properties = properties.fill_properties

glyph = require('./glyph')
Glyph = glyph.Glyph
GlyphView = glyph.GlyphView
rect = require("./rect")

class SquareView extends rect.RectView

  initialize: (options) ->
    super(options)
    ##duped in many classes
    @glyph_props = @init_glyph(@mget('glyphspec'))
    if @mget('selection_glyphspec')
      spec = _.extend({}, @mget('glyphspec'), @mget('selection_glyphspec'))
      @selection_glyphprops = @init_glyph(spec)
    if @mget('nonselection_glyphspec')
      spec = _.extend({}, @mget('glyphspec'), @mget('nonselection_glyphspec'))
      @nonselection_glyphprops = @init_glyph(spec)
    ##duped in many classes
    @do_fill   = @glyph_props.fill_properties.do_fill
    @do_stroke = @glyph_props.line_properties.do_stroke

  init_glyph : (glyphspec) ->
    fill_props = new fill_properties(@, glyphspec)
    line_props = new line_properties(@, glyphspec)
    glyph_props = new glyph_properties(
      @,
      glyphspec,
      ['x', 'y', 'size', 'angle'],
      [line_props, fill_props]
    )
    return glyph_props

  _map_data : () ->
    [@sx, @sy] = @plot_view.map_to_screen(@x, @glyph_props.x.units, @y, @glyph_props.y.units)
    @sw = @distance(@data, 'x', 'size', 'center')
    @sh = @sw

  draw_legend: (ctx, x1, x2, y1, y2) ->
    ## dummy legend function just draws a circle.. this way
    ## even if we have a differnet glyph shape, at least we get the
    ## right colors present
    glyph_props = @glyph_props
    line_props = glyph_props.line_properties
    fill_props = glyph_props.fill_properties
    ctx.save()

    reference_point = @get_reference_point()
    if reference_point?
      glyph_settings = reference_point
      data_w = @distance([reference_point], 'x', 'size', 'center')[0]
      data_h = data_w
    else
      glyph_settings = glyph_props
    border = line_props.select(line_props.line_width_name, glyph_settings)

    ctx.beginPath()
    w = Math.abs(x2-x1)
    h = Math.abs(y2-y1)
    w = w - 2*border
    h = h - 2*border
    if data_w?
      w = if data_w > w then w else data_w
    if data_h?
      h = if data_h > h then h else data_h
    x = (x1 + x2) / 2 - (w / 2)
    y = (y1 + y2) / 2 - (h / 2)
    ctx.rect(x, y, w, h)
    if fill_props.do_fill
      fill_props.set(ctx, glyph_settings)
      ctx.fill()
    if line_props.do_stroke
      line_props.set(ctx, glyph_settings)
      ctx.stroke()

    ctx.restore()

class Square extends rect.Rect
  default_view: SquareView
  type: 'GlyphRenderer'


exports.Square = Square
exports.SquareView = SquareView
