
define [
  "underscore",
  "renderer/properties",
  "./glyph",
], (_, Properties, Glyph) ->

  glyph_properties = Properties.glyph_properties
  line_properties  = Properties.line_properties

  class QuadraticView extends Glyph.View

    initialize: (options) ->
      glyphspec = @mget('glyphspec')
      @glyph_props = new glyph_properties(
        @,
        glyphspec,
        ['x0', 'y0', 'x1', 'y1', 'cx', 'cy'],
        {
          line_properties: new line_properties(@, glyphspec)
        }
      )

      @do_stroke = @glyph_props.line_properties.do_stroke
      super(options)

    _set_data: (@data) ->
      @x0 = @glyph_props.v_select('x0', data)
      @y0 = @glyph_props.v_select('y0', data)

      @x1 = @glyph_props.v_select('x1', data)
      @y1 = @glyph_props.v_select('y1', data)

      @cx = @glyph_props.v_select('cx', data)
      @cy = @glyph_props.v_select('cy', data)

    _render: () ->
      [@sx0, @sy0] = @plot_view.map_to_screen(@x0, @glyph_props.x0.units, @y0, @glyph_props.y0.units)
      [@sx1, @sy1] = @plot_view.map_to_screen(@x1, @glyph_props.x1.units, @y1, @glyph_props.y1.units)
      [@scx, @scy] = @plot_view.map_to_screen(@cx, @glyph_props.cx.units, @cy, @glyph_props.cy.units)

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
          if isNaN(@sx0[i] + @sy0[i] + @sx1[i] + @sy1[i] + @scx[i] + @scy[i])
            continue

          ctx.moveTo(@sx0[i], @sy0[i])
          ctx.quadraticCurveTo(@scx[i], @scy[i], @sx1[i], @sy1[i])

        ctx.stroke()

    _full_path: (ctx) ->
      if @do_stroke
        for i in [0..@sx0.length-1]
          if isNaN(@sx0[i] + @sy0[i] + @sx1[i] + @sy1[i] + @scx[i] + @scy[i])
            continue

          ctx.beginPath()
          ctx.moveTo(@sx0[i], @sy0[i])
          ctx.quadraticCurveTo(@scx[i], @scy[i], @sx1[i], @sy1[i])

          @glyph_props.line_properties.set(ctx, @data[i])
          ctx.stroke()

  class Quadratic extends Glyph.Model
    default_view: QuadraticView
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
    "Model": Quadratic,
    "View": QuadraticView,
  }

