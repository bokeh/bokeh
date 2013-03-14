
properties = require('./properties')
glyph_properties = properties.glyph_properties
line_properties = properties.line_properties
fill_properties = properties.fill_properties

glyph = require('./glyph')
Glyph = glyph.Glyph
GlyphView = glyph.GlyphView


class CircleView extends GlyphView

  initialize: (options) ->
    glyphspec = @mget('glyphspec')
    @glyph_props = new glyph_properties(
      @,
      glyphspec,
      ['x', 'y', 'radius']
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
    [@sx, @sy] = @map_to_screen(@x, @glyph_props.x.units, @y, @glyph_props.y.units)
    @radius = @distance(@data, 'x', 'radius', 'edge')

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
        if isNaN(@sx[i] + @sy[i] + @radius[i])
          continue
        ctx.beginPath()
        ctx.arc(@sx[i], @sy[i], @radius[i], 0, 2*Math.PI*2, false)
        ctx.fill()

    if @do_stroke
      @glyph_props.line_properties.set(ctx, @glyph_props)
      for i in [0..@sx.length-1]
        if isNaN(@sx[i] + @sy[i] + @radius[i])
          continue
        ctx.beginPath()
        ctx.arc(@sx[i], @sy[i], @radius[i], 0, 2*Math.PI*2, false)
        ctx.stroke()

  _full_path: (ctx) ->
    for i in [0..@sx.length-1]
      if isNaN(@sx[i] + @sy[i] + @radius[i])
        continue

      ctx.beginPath()
      ctx.arc(@sx[i], @sy[i], @radius[i], 0, 2*Math.PI*2, false)

      if @do_fill
        @glyph_props.fill_properties.set(ctx, @data[i])
        ctx.fill()

      if @do_stroke
        @glyph_props.line_properties.set(ctx, @data[i])
        ctx.stroke()


class Circle extends Glyph
  default_view: CircleView
  type: 'GlyphRenderer'


Circle::display_defaults = _.clone(Circle::display_defaults)
_.extend(Circle::display_defaults, {

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


class Circles extends Backbone.Collection
  model: Circle


exports.circles = new Circles
exports.Circle = Circle
exports.CircleView = CircleView

