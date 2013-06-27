
properties = require('../properties')
glyph_properties = properties.glyph_properties
line_properties = properties.line_properties
fill_properties = properties.fill_properties

glyph = require('./glyph')
Glyph = glyph.Glyph
GlyphView = glyph.GlyphView


class CircleView extends GlyphView

  initialize: (options) ->
    super(options)
    @glyph_props = @init_glyph(@mget('glyphspec'))
    if @mget('selection_glyphspec')
      @selection_glyphprops = @init_glyph(@mget('selection_glyphspec'))
    if @mget('nonselection_glyphspec')
      @nonselection_glyphprops = @init_glyph(@mget('nonselection_glyphspec'))

  init_glyph : (glyphspec) ->
    glyph_props = new glyph_properties(
      @,
      glyphspec,
      ['x', 'y', 'radius']
      [
        new fill_properties(@, glyphspec),
        new line_properties(@, glyphspec)
      ]
    )
    glyph_props.do_fill = glyph_props.fill_properties.do_fill
    glyph_props.do_stroke = glyph_props.fill_properties.do_stroke
    return glyph_props

  _set_data: (@data) ->
    @x = @glyph_props.v_select('x', data)
    @y = @glyph_props.v_select('y', data)
    @mask = new Array(data.length-1)
    @selected_mask = new Array(data.length-1)
    for i in [0..@mask.length-1]
      @mask[i] = true
      @selected_mask[i] = false

  _render: (plot_view) ->
    [@sx, @sy] = @plot_view.map_to_screen(@x, @glyph_props.x.units, @y, @glyph_props.y.units)
    @radius = @distance(@data, 'x', 'radius', 'edge')

    ow = @plot_view.view_state.get('outer_width')
    oh = @plot_view.view_state.get('outer_height')
    for i in [0..@mask.length-1]
      if (@sx[i]+@radius[i]) < 0 or (@sx[i]-@radius[i]) > ow or (@sy[i]+@radius[i]) < 0 or (@sy[i]-@radius[i]) > oh
        @mask[i] = false
      else
        @mask[i] = true

    selected = @mget_obj('data_source').get('selected')
    for idx in selected
      @selected_mask[idx] = true
    ctx = @plot_view.ctx

    ctx.save()
    if @glyph_props.fast_path
      @_fast_path(ctx)
    else
      if selected and selected.length and @nonselection_glyphprops
        if @selection_glyphprops
          props =  @selection_glyphprops
        else
          props = @glyphprops
        @_full_path(ctx, props, 'selected')
        @_full_path(ctx, @nonselection_glyphprops, 'unselected')
      else
        @_full_path(ctx)
    ctx.restore()

  _fast_path: (ctx, glyph_props) ->
    if not glyph_props
      glyph_props = @glyph_props
    if @glyph_props.do_fill
      @glyph_props.fill_properties.set(ctx, @glyph_props)
      for i in [0..@sx.length-1]
        if isNaN(@sx[i] + @sy[i] + @radius[i]) or not @mask[i]
          continue
        ctx.beginPath()
        ctx.arc(@sx[i], @sy[i], @radius[i], 0, 2*Math.PI, false)
        ctx.fill()

    if @glyph_props.do_stroke
      @glyph_props.line_properties.set(ctx, @glyph_props)
      for i in [0..@sx.length-1]
        if isNaN(@sx[i] + @sy[i] + @radius[i]) or not @mask[i]
          continue
        ctx.beginPath()
        ctx.arc(@sx[i], @sy[i], @radius[i], 0, 2*Math.PI, false)
        ctx.stroke()

  _full_path: (ctx, glyph_props, use_selection) ->
    if not glyph_props
      glyph_props = @glyph_props
    for i in [0..@sx.length-1]
      if isNaN(@sx[i] + @sy[i] + @radius[i]) or not @mask[i]
        continue
      if use_selection == 'selected' and not @selected_mask[i]
          continue
      if use_selection == 'unselected' and @selected_mask[i]
          continue
      ctx.beginPath()
      ctx.arc(@sx[i], @sy[i], @radius[i], 0, 2*Math.PI, false)

      if glyph_props.do_fill
        glyph_props.fill_properties.set(ctx, @data[i])
        ctx.fill()

      if glyph_props.do_stroke
        glyph_props.line_properties.set(ctx, @data[i])
        ctx.stroke()

  select : (xscreenbounds, yscreenbounds) ->
    xscreenbounds = [@plot_view.view_state.sx_to_device(xscreenbounds[0]),
      @plot_view.view_state.sx_to_device(xscreenbounds[1])]
    yscreenbounds = [@plot_view.view_state.sy_to_device(yscreenbounds[0]),
      @plot_view.view_state.sy_to_device(yscreenbounds[1])]
    xscreenbounds = [_.min(xscreenbounds), _.max(xscreenbounds)]
    yscreenbounds = [_.min(yscreenbounds), _.max(yscreenbounds)]
    console.log(xscreenbounds)
    console.log(yscreenbounds)
    console.log('min', _.min(this.sx), _.min(this.sy))
    console.log('max', _.max(this.sx), _.max(this.sy))

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


exports.Circle = Circle
exports.CircleView = CircleView
