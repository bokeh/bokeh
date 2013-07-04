
properties = require('../properties')
glyph_properties = properties.glyph_properties
line_properties = properties.line_properties
fill_properties = properties.fill_properties

glyph = require('./glyph')
Glyph = glyph.Glyph
GlyphView = glyph.GlyphView


class AnnulusView extends GlyphView

  initialize: (options) ->
    glyphspec = @mget('glyphspec')
    @glyph_props = new glyph_properties(
      @,
      glyphspec,
      ['x', 'y', 'inner_radius', 'outer_radius'],
      [
        new fill_properties(@, glyphspec),
        new line_properties(@, glyphspec)
      ]
    )

    @do_fill   = @glyph_props.fill_properties.do_fill
    @do_stroke = @glyph_props.line_properties.do_stroke
    super(options)

  _set_data: (@data) ->
    @x = @glyph_props.v_select('x', data)
    @y = @glyph_props.v_select('y', data)

  _render: () ->
    [@sx, @sy] = @plot_view.map_to_screen(@x, @glyph_props.x.units, @y, @glyph_props.y.units)
    @inner_radius = @distance(@data, 'x', 'inner_radius', 'edge')
    @outer_radius = @distance(@data, 'x', 'outer_radius', 'edge')

    ctx = @plot_view.ctx

    ctx.save()
    if @glyph_props.fast_path
      @_fast_path(ctx)
    else
      @_full_path(ctx)
    ctx.restore()

  _fast_path: (ctx) ->
    if @do_fill
      @glyph_props.fill_properties.set(ctx, @glyph_props)
      for i in [0..@sx.length-1]
        if isNaN(@sx[i] + @sy[i] + @inner_radius[i] + @outer_radius[i])
          continue
        ctx.beginPath()
        ctx.arc(@sx[i], @sy[i], @inner_radius[i], 0, 2*Math.PI*2, false)
        ctx.arc(@sx[i], @sy[i], @outer_radius[i], 0, 2*Math.PI*2, true)
        ctx.fill()

    if @do_stroke
      @glyph_props.line_properties.set(ctx, @glyph_props)
      for i in [0..@sx.length-1]
        if isNaN(@sx[i] + @sy[i] + @inner_radius[i] + @outer_radius[i])
          continue
        ctx.beginPath()
        ctx.arc(@sx[i], @sy[i], @inner_radius[i], 0, 2*Math.PI*2, false)
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(@sx[i], @sy[i], @outer_radius[i], 0, 2*Math.PI*2, true)
        ctx.stroke()

  _full_path: (ctx) ->
    for i in [0..@sx.length-1]
      if isNaN(@sx[i] + @sy[i] + @inner_radius[i] + @outer_radius[i])
        continue

      ctx.beginPath()
      ctx.arc(@sx[i], @sy[i], @inner_radius[i], 0, 2*Math.PI*2, false)
      ctx.moveTo(@sx[i]+@outer_radius[i], @sy[i])
      ctx.arc(@sx[i], @sy[i], @outer_radius[i], 0, 2*Math.PI*2, true)

      if @do_fill
        @glyph_props.fill_properties.set(ctx, @data[i])
        ctx.fill()

      if @do_stroke
        @glyph_props.line_properties.set(ctx, @data[i])
        ctx.stroke()

  draw_legend: (ctx, x1, x2, y1, y2) ->
    glyph_props = @glyph_props
    line_props = glyph_props.line_properties
    fill_props = glyph_props.fill_properties
    ctx.save()
    reference_point = @get_reference_point()
    if reference_point?
      glyph_settings = reference_point
      outer_radius = @distance([reference_point],'x', 'outer_radius', 'edge')
      outer_radius = outer_radius[0]
      inner_radius = @distance([reference_point],'x', 'inner_radius', 'edge')
      inner_radius = inner_radius[0]
    else
      glyph_settings = glyph_props
    border = line_props.select(line_props.line_width_name, glyph_settings)
    d = _.min([Math.abs(x2-x1), Math.abs(y2-y1)])
    d = d - 2 * border
    r = d / 2
    if outer_radius? or inner_radius?
      ratio = r / outer_radius
      outer_radius = r
      inner_radius = inner_radius * ratio
    else
      outer_radius = r
      inner_radius = r/2
    sx = (x1 + x2) / 2.0
    sy = (y1 + y2) / 2.0
    ctx.beginPath()
    ctx.arc(sx, sy, inner_radius, 0, 2*Math.PI*2, false)
    ctx.moveTo(sx + outer_radius, sy)
    ctx.arc(sx, sy, outer_radius, 0, 2*Math.PI*2, true)
    fill_props.set(ctx, glyph_settings)
    ctx.fill()
    line_props.set(ctx, glyph_settings)
    ctx.stroke()

    ctx.restore()


class Annulus extends Glyph
  default_view: AnnulusView
  type: 'GlyphRenderer'


Annulus::display_defaults = _.clone(Annulus::display_defaults)
_.extend(Annulus::display_defaults, {

  fill: 'gray'
  fill_alpha: 1.0

  line_color: 'red'
  line_width: 1
  line_alpha: 1.0
  line_join: 'miter'
  line_cap: 'butt'
  line_dash: []
  line_dash_offset: 0

})


exports.Annulus = Annulus
exports.AnnulusView = AnnulusView
