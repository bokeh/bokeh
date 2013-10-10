
properties = require('../properties')
glyph_properties = properties.glyph_properties
line_properties = properties.line_properties

glyph = require('./glyph')
Glyph = glyph.Glyph
GlyphView = glyph.GlyphView


class LineView extends GlyphView

  initialize: (options) ->
    super(options)
    ##duped in many classes
    @glyph_props = @init_glyph(@mget('glyphspec'))
    if @mget('selection_glyphspec')
      spec = _.extend({}, @mget('glyphspec'), @mget('selection_glyphspec'))
      @selection_glyphprops = @init_glyph(spec)
    if @mget('nonselection_glyphspec')
      spec = _.extend({}, @mget('glyphspec'), @mget('nonselection_glyphspec'))
      @nonselection_glyphprops = @init_glyph(spec)
    ##duped in many classes
    @do_stroke = @glyph_props.line_properties.do_stroke

  init_glyph : (glyphspec) ->
    glyph_props = new glyph_properties(
      @,
      glyphspec,
      ['x:number', 'y:number'],
      [
        new line_properties(@, glyphspec)
      ]
    )
    return glyph_props

  _set_data: (@data) ->
    @x = @glyph_props.v_select('x', data)
    @y = @glyph_props.v_select('y', data)
    #duped
    @selected_mask = new Uint8Array(data.length)
    for i in [0..@selected_mask.length-1]
      @selected_mask[i] = false
  _map_data : () ->
    [@sx, @sy] = @plot_view.map_to_screen(@x, @glyph_props.x.units, @y, @glyph_props.y.units)

  _render: () ->
    if not @do_stroke
      return
    @_map_data()
    ctx = @plot_view.ctx
    ctx.save()
    #duped
    selected = @mget_obj('data_source').get('selected')
    for idx in selected
      @selected_mask[idx] = true
    if selected and selected.length and @nonselection_glyphprops
      if @selection_glyphprops
        props =  @selection_glyphprops
      else
        props = @glyph_props
      @_draw_path(ctx, @nonselection_glyphprops, false)
      @_draw_path(ctx, props, true)
    else
      @_draw_path(ctx)
    ctx.restore()

  _draw_path: (ctx, glyph_props, draw_selected) ->
    if not glyph_props
      glyph_props = @glyph_props
    glyph_props.line_properties.set(ctx, glyph_props)

    sx = @sx
    sy = @sy
    selected_mask = @selected_mask

    drawing = false
    for i in [0..sx.length-1]
      if isNaN(sx[i]+sy[i]) or (draw_selected and not selected_mask[i]) or
                               (not draw_selected and selected_mask[i])
          if drawing
            ctx.stroke()
          drawing = false
          continue
      if not drawing
        ctx.beginPath()
        ctx.moveTo(sx[i], sy[i])
        drawing = true
      else
        ctx.lineTo(sx[i], sy[i])
    if drawing
      # Need to stroke the path after the last point
      ctx.stroke()

  draw_legend: (ctx, x1, x2, y1, y2) ->
    ctx.save()
    glyph_props = @glyph_props
    line_props = glyph_props.line_properties
    reference_point = @get_reference_point()
    if reference_point?
      glyph_settings = reference_point
    else
      glyph_settings = glyph_props
    line_props.set(ctx, glyph_settings)
    ctx.beginPath()
    ctx.moveTo(x1, (y1 + y2) /2)
    ctx.lineTo(x2, (y1 + y2) /2)
    if line_props.do_stroke
      line_props.set(ctx, glyph_settings)
      ctx.stroke()
    ctx.restore()

  ##duped
  select : (xscreenbounds, yscreenbounds) ->
    xscreenbounds = [@plot_view.view_state.sx_to_device(xscreenbounds[0]),
      @plot_view.view_state.sx_to_device(xscreenbounds[1])]
    yscreenbounds = [@plot_view.view_state.sy_to_device(yscreenbounds[0]),
      @plot_view.view_state.sy_to_device(yscreenbounds[1])]
    xscreenbounds = [_.min(xscreenbounds), _.max(xscreenbounds)]
    yscreenbounds = [_.min(yscreenbounds), _.max(yscreenbounds)]
    selected = []
    for i in [0..@sx.length-1]
      if xscreenbounds
        if @sx[i] < xscreenbounds[0] or @sx[i] > xscreenbounds[1]
          continue
      if yscreenbounds
        if @sy[i] < yscreenbounds[0] or @sy[i] > yscreenbounds[1]
          continue
      selected.push(i)
     return selected

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


exports.Line = Line
exports.LineView = LineView
