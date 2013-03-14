
properties = require('./properties')
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

        [sx, sy] = @map_to_screen(x, @glyph_props.xs.units, y, @glyph_props.ys.units)

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

        [sx, sy] = @map_to_screen(x, @glyph_props.xs.units, y, @glyph_props.ys.units)

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

class Lines extends Backbone.Collection
  model: Line

exports.lines = new Lines
exports.Line = Line
exports.LineView = LineView

