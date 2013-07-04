
properties = require('../properties')
glyph_properties = properties.glyph_properties
line_properties = properties.line_properties
fill_properties = properties.fill_properties

glyph = require('./glyph')
Glyph = glyph.Glyph
GlyphView = glyph.GlyphView


class OvalView extends GlyphView

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

  _set_data: (@data) ->
    @x = @glyph_props.v_select('x', data)
    @y = @glyph_props.v_select('y', data)
    angles = (@glyph_props.select('angle', obj) for obj in data) # TODO deg/rad
    @angle = (-angle for angle in angles) # TODO deg/rad

  _render: () ->
    [@sx, @sy] = @plot_view.map_to_screen(@x, @glyph_props.x.units, @y, @glyph_props.y.units)
    @sw = @distance(@data, 'x', 'width', 'center')
    @sh = @distance(@data, 'y', 'height', 'center')

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
        if isNaN(@sx[i] + @sy[i] + @sw[i] + @sh[i] + @angle[i])
          continue

        ctx.translate(@sx[i], @sy[i])
        ctx.rotate(@angle[i])

        ctx.beginPath()
        ctx.moveTo(0, -@sh[i]/2)
        ctx.bezierCurveTo( @sw[i]/2, -@sh[i]/2,  @sw[i]/2,  @sh[i]/2, 0,  @sh[i]/2);
        ctx.bezierCurveTo(-@sw[i]/2,  @sh[i]/2, -@sw[i]/2, -@sh[i]/2, 0, -@sh[i]/2);
        ctx.closePath()
        ctx.fill()

        ctx.rotate(-@angle[i])
        ctx.translate(-@sx[i], -@sy[i])

    if @do_fill
      @glyph_props.line_properties.set(ctx, @glyph_props)
      ctx.beginPath()
      for i in [0..@sx.length-1]
        if isNaN(@sx[i] + @sy[i] + @sw[i] + @sh[i] + @angle[i])
          continue

        ctx.translate(@sx[i], @sy[i])
        ctx.rotate(@angle[i])

        ctx.moveTo(0, -@sh[i]/2)
        ctx.bezierCurveTo( @sw[i]/2, -@sh[i]/2,  @sw[i]/2,  @sh[i]/2, 0,  @sh[i]/2);
        ctx.bezierCurveTo(-@sw[i]/2,  @sh[i]/2, -@sw[i]/2, -@sh[i]/2, 0, -@sh[i]/2);

        ctx.rotate(-@angle[i])
        ctx.translate(-@sx[i], -@sy[i])
      ctx.stroke()

  _full_path: (ctx) ->
    for i in [0..@sx.length-1]
      if isNaN(@sx[i] + @sy[i] + @sw[i] + @sh[i] + @angle[i])
        continue

      ctx.translate(@sx[i], @sy[i])
      ctx.rotate(@angle[i])

      ctx.beginPath()
      ctx.moveTo(0, -@sh[i]/2)
      ctx.bezierCurveTo( @sw[i]/2, -@sh[i]/2,  @sw[i]/2,  @sh[i]/2, 0,  @sh[i]/2);
      ctx.bezierCurveTo(-@sw[i]/2,  @sh[i]/2, -@sw[i]/2, -@sh[i]/2, 0, -@sh[i]/2);
      ctx.closePath()

      if @do_fill
        @glyph_props.fill_properties.set(ctx, @data[i])
        ctx.fill()

      if @do_stroke
        @glyph_props.line_properties.set(ctx, @data[i])
        ctx.stroke()

      ctx.rotate(-@angle[i])
      ctx.translate(-@sx[i], -@sy[i])

  draw_legend: (ctx, x1, x2, y1, y2) ->
    glyph_props = @glyph_props
    line_props = glyph_props.line_properties
    fill_props = glyph_props.fill_properties
    ctx.save()
    reference_point = @get_reference_point()
    if reference_point?
      glyph_settings = reference_point
      sw = @distance([reference_point], 'x', 'width', 'center')[0]
      sh = @distance([refrence_point], 'y', 'height', 'center')[0]
    else
      glyph_settings = glyph_props
      sw = 1.0
      sh = 2.0
    border = line_props.select(line_props.line_width_name, glyph_settings)
    w = Math.abs(x2-x1)
    h = Math.abs(y2-y1)
    w = w - 2*border
    h = h - 2*border
    ratio1 = h / sh
    ratio2 = w / sw
    ratio = _.min([ratio1, ratio2])
    h = sh * ratio
    w = sw * ratio

    ctx.translate((x1 + x2)/2, (y1 + y2)/2)
    ctx.beginPath()
    ctx.moveTo(0, -h/2)
    ctx.bezierCurveTo( w/2, -h/2,  w/2,  h/2, 0,  h/2)
    ctx.bezierCurveTo( -w/2, h/2,  -w/2,  -h/2, 0,  -h/2)
    ctx.closePath()
    fill_props.set(ctx, glyph_settings)
    ctx.fill()
    line_props.set(ctx, glyph_settings)
    ctx.stroke()

    ctx.restore()


class Oval extends Glyph
  default_view: OvalView
  type: 'GlyphRenderer'


Oval::display_defaults = _.clone(Oval::display_defaults)
_.extend(Oval::display_defaults, {

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


exports.Oval = Oval
exports.OvalView = OvalView
