
properties = require('./properties')
glyph_properties = properties.glyph_properties
line_properties = properties.line_properties

glyph = require('./glyph')
Glyph = glyph.Glyph
GlyphView = glyph.GlyphView


class ArcView extends GlyphView

  initialize: (options) ->
    glyphspec = @mget('glyphspec')
    @glyph_props = new glyph_properties(
      @,
      glyphspec,
      ['x', 'y', 'radius', 'start_angle', 'end_angle', 'direction:string'],
      [
        new line_properties(@, glyphspec)
      ]
    )

    @do_stroke = @glyph_props.line_properties.do_stroke
    super(options)

  _render: (data) ->
    ctx = @plot_view.ctx
    glyph_props = @glyph_props

    ctx.save()

    x = glyph_props.v_select('x', data)
    y = glyph_props.v_select('y', data)
    [@sx, @sy] = @map_to_screen(x, glyph_props.x.units, y, glyph_props.y.units)
    @radius = @distance(data, 'x', 'radius', 'edge')
    @start_angle = (glyph_props.select('start_angle', obj) for obj in data) # TODO deg/rad
    @end_angle = (glyph_props.select('end_angle', obj) for obj in data) # TODO deg/rad
    @direction = new Array(@sx.length)
    for i in [0..@sx.length-1]
      dir = glyph_props.select('direction', data[i])
      if dir == 'clock' then @direction[i] = false
      else if dir == 'anticlock' then @direction[i] = true
      else @direction[i] = NaN

    if @glyph_props.fast_path
      @_fast_path(ctx, glyph_props)
    else
      @_full_path(ctx, glyph_props, data)

    ctx.restore()

  _fast_path: (ctx, glyph_props) ->
    if @do_stroke
      glyph_props.line_properties.set(ctx, glyph_props)
      for i in [0..@sx.length-1]
        if isNaN(@sx[i] + @sy[i] + @radius[i] + @start_angle[i] + @end_angle[i] + @direction[i])
          continue
        ctx.beginPath()
        ctx.arc(@sx[i], @sy[i], @radius[i], @start_angle[i], @end_angle[i], @direction[i])
        ctx.stroke()

  _full_path: (ctx, glyph_props, data) ->
    if @do_stroke
      for i in [0..@sx.length-1]
        if isNaN(@sx[i] + @sy[i] + @radius[i] + @start_angle[i] + @end_angle[i] + @direction[i])
          continue

        ctx.beginPath()
        ctx.arc(@sx[i], @sy[i], @radius[i], @start_angle[i], @end_angle[i], @direction[i])

        glyph_props.line_properties.set(ctx, data[i])
        ctx.stroke()


class Arc extends Glyph
  default_view: ArcView
  type: 'GlyphRenderer'


Arc::display_defaults = _.clone(Arc::display_defaults)
_.extend(Arc::display_defaults, {

  line_color: 'red'
  line_width: 1
  line_alpha: 1.0
  line_join: 'miter'
  line_cap: 'butt'
  line_dash: []
  line_dash_offset: 0

})


class Arcs extends Backbone.Collection
  model: Arc


exports.arcs = new Arcs
exports.Arc = Arc
exports.ArcView = ArcView

