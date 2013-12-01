
define [
  "underscore",
  "renderer/properties",
  "./glyph",
], (_, Properties, Glyph) ->

  glyph_properties = Properties.glyph_properties
  line_properties  = Properties.line_properties

  class BezierView extends Glyph.View
    _base_glyphspec : ['x0', 'y0', 'x1', 'y1', 'cx0', 'cy0', 'cx1', 'cy1']

    _data_fields : ['x0', 'y0', 'x1', 'y1', 'cx0', 'cy0', 'cx1', 'cy1']
    set_data: (render) ->
      @set_data_new(render)

    #have to overide this, because beziers don't have x and y
    set_data_new: (request_render=true) ->
      source = @mget_obj('data_source')
      for field in @_data_fields
        @[field] = @glyph_props.source_v_select(field, source)
      @mask = new Uint8Array(@x0.length)
      @selected_mask = new Uint8Array(@x0.length)
      for i in [0..@mask.length-1]
        @mask[i] = true
        @selected_mask[i] = false
      @have_new_data = true


    _render: () ->
      [@sx0,  @sy0]  = @plot_view.map_to_screen(@x0,  @glyph_props.x0.units,  @y0, @glyph_props.y0.units)
      [@sx1,  @sy1]  = @plot_view.map_to_screen(@x1,  @glyph_props.x1.units,  @y1, @glyph_props.y1.units)
      [@scx0, @scy0] = @plot_view.map_to_screen(@cx0, @glyph_props.cx0.units, @cy0, @glyph_props.cy0.units)
      [@scx1, @scy1] = @plot_view.map_to_screen(@cx1, @glyph_props.cx1.units, @cy1, @glyph_props.cy1.units)
      #fixme hack
      @x = @x0
      @do_stroke = true
      @do_fill = true
      @_render_core()

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

    _full_path: (ctx, glyph_props) ->
      if @do_stroke
        for i in [0..@sx0.length-1]

          if isNaN(@sx0[i] + @sy0[i] + @sx1[i] + @sy1[i] + @scx0[i] + @scy0[i] + @scx1[i] + @scy1[i])
            continue

          ctx.beginPath()
          ctx.moveTo(@sx0[i], @sy0[i])
          ctx.bezierCurveTo(@scx0[i], @scy0[i], @scx1[i], @scy1[i], @sx1[i], @sy1[i])

          glyph_props.line_properties.set_vectorize(ctx, i)
          ctx.stroke()

  class Bezier extends Glyph.Model
    default_view: BezierView
    type: 'Glyph'

    display_defaults: () ->
      return _.extend(super(), {
        line_color: 'red'
        line_width: 1
        line_alpha: 1.0
        line_join: 'miter'
        line_cap: 'butt'
        line_dash: []
        line_dash_offset: 0
      })

  return {
    "Model": Bezier,
    "View": BezierView,
  }

