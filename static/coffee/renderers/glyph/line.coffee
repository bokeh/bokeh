
properties = require('../properties')
glyph_properties = properties.glyph_properties
line_properties = properties.line_properties

glyph = require('./glyph')
Glyph = glyph.Glyph
GlyphView = glyph.GlyphView


class LineView extends GlyphView

  initialize: (options) ->
    glyphspec = @mget('glyphspec')
    @glyph_props = new glyph_properties(
      @,
      glyphspec,
      ['x:number', 'y:number'],
      [
        new line_properties(@, glyphspec)
      ]
    )

    @do_stroke = @glyph_props.line_properties.do_stroke
    super(options)

  _set_data: (@data) ->
    @x = @glyph_props.v_select('x', data)
    @y = @glyph_props.v_select('y', data)

  _render: () ->
    ctx = @plot_view.ctx

    ctx.save()

    # only one line, no fast/full path distinction
    @glyph_props.line_properties.set(ctx, @glyph_props)

    [sx, sy] = @plot_view.map_to_screen(@x, @glyph_props.x.units, @y, @glyph_props.y.units)

    for i in [0..sx.length-1]
      if i == 0
        ctx.beginPath()
        ctx.moveTo(sx[i], sy[i])
        continue
      else if isNaN(sx[i]) or isNaN(sy[i])
        ctx.stroke()
        ctx.beginPath()
        continue
      else
        ctx.lineTo(sx[i], sy[i])
    ctx.stroke()

    ctx.restore()

  draw_legend: (ctx, x1, x2, y1, y2) ->
    glyph_props = @glyph_props
    line_props = glyph_props.line_properties
    reference_point = @get_reference_point()
    if reference_point?
      glyph_settings = reference_point
    else
      glyph_settings = glyph_props
    line_props.set(ctx, glyph_settings)
    ctx.beginPath()
    ctx.moveTo(x1, (y1 + y2) /2)
    ctx.lineTo(x2, (y1 + y2) /2)
    ctx.stroke()
    ctx.beginPath()
    ctx.restore()

class Line extends Glyph
  default_view: LineView
  type: 'GlyphRenderer'


Line::display_defaults = _.clone(Line::display_defaults)
_.extend(Line::display_defaults, {

  line_color: 'red'
  line_width: 1
  line_alpha: 1.0
  line_join: 'miter'
  line_cap: 'butt'
  line_dash: []
  line_dash_offset: 0

})


exports.Line = Line
exports.LineView = LineView
