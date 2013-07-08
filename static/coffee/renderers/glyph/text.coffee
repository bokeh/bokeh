
properties = require('../properties')
glyph_properties = properties.glyph_properties
text_properties = properties.text_properties

glyph = require('./glyph')
Glyph = glyph.Glyph
GlyphView = glyph.GlyphView


class TextView extends GlyphView

  initialize: (options) ->
    glyphspec = @mget('glyphspec')
    @glyph_props = new glyph_properties(
      @,
      glyphspec,
      ['x', 'y', 'angle', 'text:string'],
      [
        new text_properties(@, glyphspec)
      ]
    )

    super(options)

  _set_data: (@data) ->
    @x = @glyph_props.v_select('x', data)
    @y = @glyph_props.v_select('y', data)
    angles = (@glyph_props.select("angle", obj) for obj in data) # TODO deg/rad
    @angle = (-angle for angle in angles)
    @text = @glyph_props.v_select("text", data)

  _render: () ->
    [@sx, @sy] = @plot_view.map_to_screen(@x, @glyph_props.x.units, @y, @glyph_props.y.units)

    ctx = @plot_view.ctx

    ctx.save()
    if @glyph_props.fast_path
      @_fast_path(ctx)
    else
      @_full_path(ctx)
    ctx.restore()

  _fast_path: (ctx) ->
    @glyph_props.text_properties.set(ctx, @glyph_props)
    for i in [0..@sx.length-1]
      if isNaN(@sx[i] + @sy[i] + @angle[i])
        continue

      if angle[i]
        ctx.translate(@sx[i], @sy[i])
        ctx.rotate(@angle[i])
        ctx.fillText(@text[i], 0, 0)
        ctx.rotate(-@angle[i])
        ctx.translate(-@sx[i], -@sy[i])
      else
        ctx.fillText(text[i], @sx[i], @sy[i])

  _full_path: (ctx) ->
    for i in [0..@sx.length-1]
      if isNaN(@sx[i] + @sy[i] + @angle[i])
        continue

      ctx.translate(@sx[i], @sy[i])
      ctx.rotate(@angle[i])

      @glyph_props.text_properties.set(ctx, @data[i])
      ctx.fillText(@text[i], 0, 0)

      ctx.rotate(-@angle[i])
      ctx.translate(-@sx[i], -@sy[i])

  draw_legend: (ctx, x1, x2, y1, y2) ->
    glyph_props = @glyph_props
    text_props = glyph_props.text_properties
    ctx.save()
    reference_point = @get_reference_point()
    if reference_point?
      glyph_settings = reference_point
    else
      glyph_settings = glyph_props
    text_props.set(ctx, glyph_settings)
    #override some features so we fit inside the legend
    ctx.font = text_props.font(12)
    ctx.textAlign = "right"
    ctx.textBaseline = "middle"
    ctx.fillText("txt", x2, (y1+y2)/2)

    ctx.restore()

class Text extends Glyph
  default_view: TextView
  type: 'GlyphRenderer'


Text::display_defaults = _.clone(Text::display_defaults)
_.extend(Text::display_defaults, {

  text_font: "helvetica"
  text_font_size: "12pt"
  text_font_style: "normal"
  text_color: "#444444"
  text_alpha: 1.0
  text_align: "left"
  text_baseline: "bottom"

})


exports.Text = Text
exports.TextView = TextView
