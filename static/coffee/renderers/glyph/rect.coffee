
properties = require('../properties')
glyph_properties = properties.glyph_properties
line_properties = properties.line_properties
fill_properties = properties.fill_properties

glyph = require('./glyph')
Glyph = glyph.Glyph
GlyphView = glyph.GlyphView


class RectView extends GlyphView

  initialize: (options) ->
    glyphspec = @mget('glyphspec')
    fill_props = new fill_properties(@, glyphspec)
    line_props = new line_properties(@, glyphspec)
    @glyph_props = new glyph_properties(
      @,
      glyphspec,
      ['x', 'y', 'width', 'height', 'angle'],
      [line_props, fill_props]
    )
    @do_fill   = @glyph_props.fill_properties.do_fill
    @do_stroke = @glyph_props.line_properties.do_stroke
    super(options)

  _set_data: (@data) ->
    @x = @glyph_props.v_select('x', data)
    @y = @glyph_props.v_select('y', data)
    angles = (@glyph_props.select('angle', obj) for obj in data) # TODO deg/rad
    @angle = (-angle for angle in angles)

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
      @glyph_props.line_properties.set(ctx, @glyph_props)
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
      data_w = @distance([reference_point], 'x', 'width', 'center')[0]
      data_h = @distance([reference_point], 'y', 'height', 'center')[0]
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
    fill_props.set(ctx, glyph_settings)
    ctx.fill()
    line_props.set(ctx, glyph_settings)
    ctx.stroke()

    ctx.restore()

  _full_path: (ctx) ->
    for i in [0..@sx.length-1]
      if isNaN(@sx[i] + @sy[i] + @sw[i] + @sh[i] + @angle[i])
        continue

      ctx.translate(@sx[i], @sy[i])
      ctx.rotate(@angle[i])

      ctx.beginPath()
      ctx.rect(-@sw[i]/2, -@sh[i]/2, @sw[i], @sh[i])

      if @do_fill
        @glyph_props.fill_properties.set(ctx, @data[i])
        ctx.fill()

      if @do_stroke
        @glyph_props.line_properties.set(ctx, @data[i])
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


exports.Rect = Rect
exports.RectView = RectView
