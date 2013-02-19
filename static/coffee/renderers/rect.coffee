
properties = require('./properties')
glyph_properties = properties.glyph_properties
line_properties = properties.line_properties
fill_properties = properties.fill_properties

glyph = require('./glyph')
Glyph = glyph.Glyph
GlyphView = glyph.GlyphView


class RectView extends GlyphView

  initialize: (options) ->
    glyphspec = @mget('glyphspec')
    @glyph_props = new glyph_properties(
      @,
      glyphspec,
      ['x', 'y', 'width', 'height', 'angle'],
      [
        new fill_properties(@, glyphspec),
        new line_properties(@, glyphspec)
      ]
    )

    @do_fill   = @glyph_props.fill_properties.do_fill
    @do_stroke = @glyph_props.line_properties.do_stroke
    super(options)

  _render: (data) ->
    ctx = @plot_view.ctx
    glyph_props = @glyph_props

    ctx.save()

    x = glyph_props.v_select('x', data)
    y = glyph_props.v_select('y', data)
    [@sx, @sy] = @map_to_screen(x, glyph_props.x.units, y, glyph_props.y.units)
    @sw = @distance(data, 'x', 'width', 'center')
    @sh = @distance(data, 'y', 'height', 'center')
    @angle = (glyph_props.select('angle', obj) for obj in data) # TODO deg/rad

    if @glyph_props.fast_path
      @_fast_path(ctx, glyph_props)
    else
      @_full_path(ctx, glyph_props, data)

    ctx.restore()

  _fast_path: (ctx, glyph_props) ->
    if @do_fill
      glyph_props.fill_properties.set(ctx, glyph)
      ctx.beginPath()
      for i in [0..@sx.length-1]
        if isNaN(@sx[i] + @sy[i] + @sw[i] + @sh[i] + @angle[i])
          continue

        if @angle[i]
          ctx.translate(@sx[i], @sy[i])
          ctx.rotate(@angle[i])
          ctx.rect(-@sw[i]/2, -@sh[i]/2, @sw[i], @sh[i])
          ctx.rotate(-@angle[i])
          ctx.translate(-@sx[i], -@sy[i])
        else
          ctx.rect(@sx[i]-@sw[i]/2, @sy[i]-@sh[i]/2, @sw[i], @sh[i])

      ctx.fill()

    if @do_stroke
      glyph_props.line_properties.set(ctx, glyph)
      ctx.beginPath()
      for i in [0..@sx.length-1]
        if isNaN(@sx[i] + @sy[i] + @sw[i] + @sh[i] + @angle[i])
          continue

        if @angle[i]
          ctx.translate(@sx[i], @sy[i])
          ctx.rotate(@angle[i])
          ctx.rect(-@sw[i]/2, -@sh[i]/2, @sw[i], @sh[i])
          ctx.rotate(-@angle[i])
          ctx.translate(-@sx[i], -@sy[i])
        else
          ctx.rect(@sx[i]-@sw[i]/2, @sy[i]-@sh[i]/2, @sw[i], @sh[i])

      ctx.stroke()

  _full_path: (ctx, glyph_props, data) ->
    for i in [0..@sx.length-1]
      if isNaN(@sx[i] + @sy[i] + @sw[i] + @sh[i] + @angle[i])
        continue

      ctx.translate(@sx[i], @sy[i])
      ctx.rotate(@angle[i])

      ctx.beginPath()
      ctx.rect(-@sw[i]/2, -@sh[i]/2, @sw[i], @sh[i])

      if @do_fill
        glyph_props.fill_properties.set(ctx, data[i])
        ctx.fill()

      if @do_stroke
        glyph_props.line_properties.set(ctx, data[i])
        ctx.stroke()

      ctx.rotate(-@angle[i])
      ctx.translate(-@sx[i], -@sy[i])


class Rect extends Glyph
  default_view: RectView
  type: 'GlyphRenderer'


Rect::display_defaults = _.clone(Rect::display_defaults)
_.extend(Rect::display_defaults, {

  fill: 'gray'
  fill_alpha: 1.0

  line_color: 'red'
  line_width: 1
  line_alpha: 1.0
  line_join: 'miter'
  line_cap: 'butt'
  line_dash: []
  line_dash_offset: 0

  angle: 0.0

})

class Rects extends Backbone.Collection
  model: Rect

exports.rects = new Rects
exports.Rect = Rect
exports.RectView = RectView
