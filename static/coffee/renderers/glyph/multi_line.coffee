
properties = require('../properties')
glyph_properties = properties.glyph_properties
line_properties = properties.line_properties

glyph = require('./glyph')
Glyph = glyph.Glyph
GlyphView = glyph.GlyphView


class MultiLineView extends GlyphView

  initialize: (options) ->
    glyphspec = @mget('glyphspec')
    @glyph_props = new glyph_properties(
      @,
      glyphspec,
      ['xs:array', 'ys:array'],
      [
        new line_properties(@, glyphspec)
      ]
    )

    @do_stroke = @glyph_props.line_properties.do_stroke
    super(options)

  _set_data: (@data) ->
    # TODO save screen coords

  _render: () ->
    ctx = @plot_view.ctx

    ctx.save()
    if @glyph_props.fast_path
      @_fast_path(ctx)
    else
      @_full_path(ctx)
    ctx.restore()

  _fast_path: (ctx) ->
    if @do_stroke
      @glyph_props.line_properties.set(ctx, @glyph_props)
      for pt in @data
        x = @glyph_props.select('xs', pt)
        y = @glyph_props.select('ys', pt)

        [sx, sy] = @plot_view.map_to_screen(x, @glyph_props.xs.units, y, @glyph_props.ys.units)

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

  _full_path: (ctx) ->
    if @do_stroke
      for pt in @data
        x = @glyph_props.select('xs', pt)
        y = @glyph_props.select('ys', pt)

        [sx, sy] = @plot_view.map_to_screen(x, @glyph_props.xs.units, y, @glyph_props.ys.units)

        @glyph_props.line_properties.set(ctx, pt)
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

  draw_legend: (ctx, x1, x2, y1, y2) ->
    glyph_props = @glyph_props
    line_props = glyph_props.line_properties
    reference_point = @get_reference_point()
    if reference_point?
      glyph_settings = reference_point
    else
      glyph_settings = glyph_props
    ctx.beginPath()
    ctx.moveTo(x1, (y1 + y2) /2)
    ctx.lineTo(x2, (y1 + y2) /2)
    if line_props.do_stroke
      line_props.set(ctx, glyph_settings)
      ctx.stroke()
    ctx.restore()

class MultiLine extends Glyph
  default_view: MultiLineView
  type: 'GlyphRenderer'


MultiLine::display_defaults = _.clone(MultiLine::display_defaults)
_.extend(MultiLine::display_defaults, {

  line_color: 'red'
  line_width: 1
  line_alpha: 1.0
  line_join: 'miter'
  line_cap: 'butt'
  line_dash: []
  line_dash_offset: 0

})


exports.MultiLine = MultiLine
exports.MultiLineView = MultiLineView
