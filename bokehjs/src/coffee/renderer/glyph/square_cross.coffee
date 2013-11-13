
define [
  "underscore",
  "renderer/properties",
  "./glyph",
], (_, Properties, Glyph) ->

  glyph_properties = Properties.glyph_properties
  line_properties  = Properties.line_properties
  fill_properties  = Properties.fill_properties

  class SquareCrossView extends Glyph.View

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
      @do_fill   = @glyph_props.fill_properties.do_fill
      @do_stroke = @glyph_props.line_properties.do_stroke

    init_glyph: (glyphspec) ->
      glyph_props = new glyph_properties(
        @,
        glyphspec,
        ['x', 'y', 'size'],
        {
          fill_properties: new fill_properties(@, glyphspec),
          line_properties: new line_properties(@, glyphspec)
        }
      )
      return glyph_props

    _set_data: (@data) ->
      @x = @glyph_props.v_select('x', data)
      @y = @glyph_props.v_select('y', data)

    _map_data: () ->
      [@sx, @sy] = @plot_view.map_to_screen(@x, @glyph_props.x.units, @y, @glyph_props.y.units)
      @sw = @distance(@data, 'x', 'size', 'center')
      @sh = @sw

    _render: () ->
      @_map_data()
      ctx = @plot_view.ctx

      #duped
      selected = @mget_obj('data_source').get('selected')
      for idx in selected
        @selected_mask[idx] = true

      ctx.save()
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
        ctx.beginPath()
        for i in [0..@sx.length-1]
          if isNaN(@sx[i] + @sy[i] + @sw[i] + @sh[i])
            continue

          ctx.rect(@sx[i]-@sw[i]/2, @sy[i]-@sh[i]/2, @sw[i], @sh[i])

        ctx.fill()

      if @do_stroke
        @glyph_props.line_properties.set(ctx, @glyph_props)
        ctx.beginPath()
        for i in [0..@sx.length-1]
          if isNaN(@sx[i] + @sy[i] + @sw[i] + @sh[i])
            continue

          ctx.rect(@sx[i]-@sw[i]/2, @sy[i]-@sh[i]/2, @sw[i], @sh[i])
          r = @sw[i]/2
          ctx.moveTo(@sx[i],   @sy[i]+r)
          ctx.lineTo(@sx[i],   @sy[i]-r)
          ctx.moveTo(@sx[i]-r, @sy[i])
          ctx.lineTo(@sx[i]+r, @sy[i])

        ctx.stroke()

    _full_path: (ctx, glyph_props, use_selection) ->
      if not glyph_props
        glyph_props = @glyph_props
      for i in [0..@sx.length-1]
        if isNaN(@sx[i] + @sy[i] + @sw[i] + @sh[i])
          continue
        if use_selection == 'selected' and not @selected_mask[i]
          continue
        if use_selection == 'unselected' and @selected_mask[i]
          continue
        ctx.translate(@sx[i], @sy[i])

        ctx.beginPath()
        ctx.rect(-@sw[i]/2, -@sh[i]/2, @sw[i], @sh[i])

        if @do_fill
          glyph_props.fill_properties.set(ctx, @data[i])
          ctx.fill()

        if @do_stroke
          glyph_props.line_properties.set(ctx, @data[i])
          r = @sw[i]/2
          ctx.moveTo(0,  +r)
          ctx.lineTo(0,  -r)
          ctx.moveTo(-r, 0)
          ctx.lineTo(+r, 0)
          ctx.stroke()

        ctx.translate(-@sx[i], -@sy[i])


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
        data_w = @distance([reference_point], 'x', 'size', 'center')[0]
        data_h = data_w
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
      if fill_props.do_fill
        fill_props.set(ctx, glyph_settings)
        ctx.fill()
      if line_props.do_stroke
        line_props.set(ctx, glyph_settings)
        ctx.moveTo(x,   y+r)
        ctx.lineTo(x,   y-r)
        ctx.moveTo(x-r, y)
        ctx.lineTo(x+r, y)
        ctx.stroke()

      ctx.restore()

  class SquareCross extends Glyph.Model
    default_view: SquareCrossView
    type: 'Glyph'

    display_defaults: () ->
      return _.extend(super(), {
        fill_color: 'gray'
        fill_alpha: 1.0
        line_color: 'red'
        line_width: 1
        line_alpha: 1.0
        line_join: 'miter'
        line_cap: 'butt'
        line_dash: []
        line_dash_offset: 0
      })

  return {
    "Model": SquareCross,
    "View": SquareCrossView,
  }

