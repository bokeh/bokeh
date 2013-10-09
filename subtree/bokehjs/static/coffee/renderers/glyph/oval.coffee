
properties = require('../properties')
glyph_properties = properties.glyph_properties
line_properties = properties.line_properties
fill_properties = properties.fill_properties

glyph = require('./glyph')
Glyph = glyph.Glyph
GlyphView = glyph.GlyphView


class OvalView extends GlyphView

  initialize: (options) ->
    ##duped in many classes
    @glyph_props = @init_glyph(@mget('glyphspec'))
    if @mget('selection_glyphspec')
      spec = _.extend({}, @mget('glyphspec'), @mget('selection_glyphspec'))
      @selection_glyphprops = @init_glyph(spec)
    if @mget('nonselection_glyphspec')
      spec = _.extend({}, @mget('glyphspec'), @mget('nonselection_glyphspec'))
      @nonselection_glyphprops = @init_glyph(spec)
    ##duped in many classes
    @do_fill   = @glyph_props.fill_properties.do_fill
    @do_stroke = @glyph_props.line_properties.do_stroke
    super(options)
  init_glyph : (glyphspec) ->
    glyph_props = new glyph_properties(
      @,
      glyphspec,
      ['x', 'y', 'width', 'height', 'angle'],
      [
        new fill_properties(@, glyphspec),
        new line_properties(@, glyphspec)
      ]
    )
    return glyph_props

  _set_data: (@data) ->
    @x = @glyph_props.v_select('x', data)
    @y = @glyph_props.v_select('y', data)
    # TODO (bev) handle degrees in addition to radians
    angles = @glyph_props.v_select('angle', data)
    @angle = (-angle for angle in angles)
    #duped
    @selected_mask = new Uint8Array(data.length)
    for i in [0..@selected_mask.length-1]
      @selected_mask[i] = false

  _render: () ->
    [@sx, @sy] = @plot_view.map_to_screen(@x, @glyph_props.x.units, @y, @glyph_props.y.units)
    @sw = @distance(@data, 'x', 'width', 'center')
    @sh = @distance(@data, 'y', 'height', 'center')

    ctx = @plot_view.ctx

    ctx.save()
    #duped
    selected = @mget_obj('data_source').get('selected')
    for idx in selected
      @selected_mask[idx] = true
    if @glyph_props.fast_path
      @_fast_path(ctx)
    else
      ##duped in many classes
      if selected and selected.length and @nonselection_glyphprops
        if @selection_glyphprops
          props =  @selection_glyphprops
        else
          props = @glyph_props
        @_full_path(ctx, props, 'selected')
        @_full_path(ctx, @nonselection_glyphprops, 'unselected')
      else
        @_full_path(ctx)
      ##duped in many classes
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

  _full_path: (ctx, glyph_props, use_selection) ->
    if not glyph_props
      glyph_props = @glyph_props
    for i in [0..@sx.length-1]
      if isNaN(@sx[i] + @sy[i] + @sw[i] + @sh[i] + @angle[i])
        continue
      if isNaN(@sx[i] + @sy[i] + @sw[i] + @sh[i] + @angle[i])
        continue
      if use_selection == 'selected' and not @selected_mask[i]
        continue
      if use_selection == 'unselected' and @selected_mask[i]
        continue
      ctx.translate(@sx[i], @sy[i])
      ctx.rotate(@angle[i])

      ctx.beginPath()
      ctx.moveTo(0, -@sh[i]/2)
      ctx.bezierCurveTo( @sw[i]/2, -@sh[i]/2,  @sw[i]/2,  @sh[i]/2, 0,  @sh[i]/2);
      ctx.bezierCurveTo(-@sw[i]/2,  @sh[i]/2, -@sw[i]/2, -@sh[i]/2, 0, -@sh[i]/2);
      ctx.closePath()

      if @do_fill
        glyph_props.fill_properties.set(ctx, @data[i])
        ctx.fill()

      if @do_stroke
        glyph_props.line_properties.set(ctx, @data[i])
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
    if fill_props.do_fill
      fill_props.set(ctx, glyph_settings)
      ctx.fill()
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


class Oval extends Glyph
  default_view: OvalView
  type: 'GlyphRenderer'


Oval::display_defaults = _.clone(Oval::display_defaults)
_.extend(Oval::display_defaults, {

  fill_color: 'gray'
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
