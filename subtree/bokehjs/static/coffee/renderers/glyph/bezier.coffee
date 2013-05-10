
properties = require('../properties')
glyph_properties = properties.glyph_properties
line_properties = properties.line_properties

glyph = require('./glyph')
Glyph = glyph.Glyph
GlyphView = glyph.GlyphView


class BezierView extends GlyphView

  initialize: (options) ->
    glyphspec = @mget('glyphspec')
    @glyph_props = new glyph_properties(
      @,
      glyphspec,
      ['x0', 'y0', 'x1', 'y1', 'cx0', 'cy0', 'cx1', 'cy1']
      [
        new line_properties(@, glyphspec)
      ]
    )

    @do_stroke = @glyph_props.line_properties.do_stroke
    super(options)

  _set_data: (@data) ->
    @x0 = @glyph_props.v_select('x0', data)
    @y0 = @glyph_props.v_select('y0', data)

    @x1 = @glyph_props.v_select('x1', data)
    @y1 = @glyph_props.v_select('y1', data)

    @cx0 = @glyph_props.v_select('cx0', data)
    @cy0 = @glyph_props.v_select('cy0', data)

    @cx1 = @glyph_props.v_select('cx1', data)
    @cy1 = @glyph_props.v_select('cy1', data)

  _render: () ->
    [@sx0,  @sy0]  = @plot_view.map_to_screen(@x0,  @glyph_props.x0.units,  @y0, @glyph_props.y0.units)
    [@sx1,  @sy1]  = @plot_view.map_to_screen(@x1,  @glyph_props.x1.units,  @y1, @glyph_props.y1.units)
    [@scx0, @scy0] = @plot_view.map_to_screen(@cx0, @glyph_props.cx0.units, @cy0, @glyph_props.cy0.units)
    [@scx1, @scy1] = @plot_view.map_to_screen(@cx1, @glyph_props.cx1.units, @cy1, @glyph_props.cy1.units)

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
      ctx.beginPath()
      for i in [0..@sx0.length-1]
        if isNaN(@sx0[i] + @sy0[i] + @sx1[i] + @sy1[i] + @scx0[i] + @scy0[i] + @scx1[i] + @scy1[i])
          continue
        ctx.moveTo(@sx0[i], @sy0[i])
        ctx.bezierCurveTo(@scx0[i], @scy0[i], @scx1[i], @scy1[i], @sx1[i], @sy1[i])
      ctx.stroke()

  _full_path: (ctx) ->
    if @do_stroke
      for i in [0..@sx0.length-1]
        if isNaN(@sx0[i] + @sy0[i] + @sx1[i] + @sy1[i] + @scx0[i] + @scy0[i] + @scx1[i] + @scy1[i])
          continue

        ctx.beginPath()
        ctx.moveTo(@sx0[i], @sy0[i])
        ctx.bezierCurveTo(@scx0[i], @scy0[i], @scx1[i], @scy1[i], @sx1[i], @sy1[i])

        @glyph_props.line_properties.set(ctx, @data[i])
        ctx.stroke()



class Bezier extends Glyph
  default_view: BezierView
  type: 'GlyphRenderer'


Bezier::display_defaults = _.clone(Bezier::display_defaults)
_.extend(Bezier::display_defaults, {

  line_color: 'red'
  line_width: 1
  line_alpha: 1.0
  line_join: 'miter'
  line_cap: 'butt'
  line_dash: []
  line_dash_offset: 0

})


exports.Bezier = Bezier
exports.BezierView = BezierView

