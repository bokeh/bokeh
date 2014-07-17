define [
  "backbone",
  "kiwi",
  "./canvas_template"
  "./continuum_view",
  "./panel"
  "./solver",
], (Backbone, kiwi, canvas_template, ContinuumView, Panel, Solver) ->

  Expr = kiwi.Expression
  Constraint = kiwi.Constraint
  EQ = kiwi.Operator.Eq

  class CanvasView extends ContinuumView.View

    className: "bokeh plotview"

    template: canvas_template

    events:
      "mousemove .bokeh_canvas_wrapper": "_mousemove"
      "mousedown .bokeh_canvas_wrapper": "_mousedown"

    initialize: (options) ->
      super(options)

      template_data = {
        map: @mget('map')
      }
      html = @template(template_data)
      @$el.html(html)

      @canvas_wrapper = @$el.find('.bokeh_canvas_wrapper')
      @canvas = @$el.find('canvas.bokeh_canvas')
      @map_div = @$el.find('.bokeh_gmap') ? null

    render: (force=false) ->
      # normally we only want to render the canvas when the canvas itself
      # should be configured with new bounds.
      if not @model.new_bounds and not force
        return

      @ctx = @canvas[0].getContext('2d')

      if @mget('use_hidpi')
        devicePixelRatio = window.devicePixelRatio || 1
        backingStoreRatio = @ctx.webkitBackingStorePixelRatio ||
                            @ctx.mozBackingStorePixelRatio ||
                            @ctx.msBackingStorePixelRatio ||
                            @ctx.oBackingStorePixelRatio ||
                            @ctx.backingStorePixelRatio || 1
        ratio = devicePixelRatio / backingStoreRatio
      else
        ratio = 1

      width = @mget('width')
      height = @mget('height')

      @canvas.width = width * @dpi_ratio
      @canvas.height = height * @dpi_ratio

      @canvas_wrapper.attr('style', "width:#{width}px; height:#{height}px")
      @canvas.attr('style', "width:#{width}px;")
      @canvas.attr('style', "height:#{height}px;")
      @canvas.attr('width', width*ratio).attr('height', height*ratio)
      @$el.attr("width", width).attr('height', height)

      @ctx.scale(ratio, ratio)
      @ctx.translate(0.5, 0.5)

      # work around canvas incompatibilities
      @_fixup_line_dash(@ctx)
      @_fixup_line_dash_offset(@ctx)
      @_fixup_image_smoothing(@ctx)
      @_fixup_measure_text(@ctx)

      @model.new_bounds = false

    _fixup_line_dash: (ctx) ->
      if (!ctx.setLineDash)
        ctx.setLineDash = (dash) ->
          ctx.mozDash = dash
          ctx.webkitLineDash = dash
      if (!ctx.getLineDash)
        ctx.getLineDash = () ->
          return ctx.mozDash

    _fixup_line_dash_offset: (ctx) ->
      ctx.setLineDashOffset = (dash_offset) ->
        ctx.lineDashOffset = dash_offset
        ctx.mozDashOffset = dash_offset
        ctx.webkitLineDashOffset = dash_offset
      ctx.getLineDashOffset = () ->
        return ctx.mozDashOffset

    _fixup_image_smoothing: (ctx) ->
      ctx.setImageSmoothingEnabled = (value) ->
        ctx.imageSmoothingEnabled = value;
        ctx.mozImageSmoothingEnabled = value;
        ctx.oImageSmoothingEnabled = value;
        ctx.webkitImageSmoothingEnabled = value;
      ctx.getImageSmoothingEnabled = () ->
        return ctx.imageSmoothingEnabled ? true

    _fixup_measure_text: (ctx) ->
      if ctx.measureText and not ctx.html5MeasureText?
        ctx.html5MeasureText = ctx.measureText

        ctx.measureText = (text) ->
          textMetrics = ctx.html5MeasureText(text)
          # fake it 'til you make it
          textMetrics.ascent = ctx.html5MeasureText("m").width * 1.6
          return textMetrics

    _mousedown: (e) =>
      for f in @mget('mousedown_callbacks')
        f(e, e.layerX, e.layerY)

    _mousemove: (e) =>
      for f in @mget('mousemove_callbacks')
        f(e, e.layerX, e.layerY)

  class Canvas extends Panel.Model
    type: 'Canvas'
    default_view: CanvasView

    initialize: (attr, options) ->
      solver = new Solver()
      @set('solver', solver)
      super(attr, options)

      @new_bounds = true

      solver.add_constraint(new Constraint(new Expr(@_left), EQ))
      solver.add_constraint(new Constraint(new Expr(@_bottom), EQ))
      @_set_dims([@get('canvas_width'), @get('canvas_height')])

    # transform view coordinates to underlying screen coordinates
    vx_to_sx: (x) ->
      return x
    vy_to_sy: (y) ->
      return @get('height') - y

    # vectorized versions of vx_to_sx/vy_to_sy, these are mutating, in-place operations
    v_vx_to_sx: (xx) ->
      for x, idx in xx
        xx[idx] = x
      return xx
    v_vy_to_sy: (yy) ->
      canvas_height = @get('height')
      for y, idx in yy
        yy[idx] = canvas_height - y
      return yy

    # transform underlying screen coordinates to view coordinates
    sx_to_vx: (x) ->
      return x
    sy_to_vy: (y) ->
      return @get('height') - y

    # vectorized versions of sx_to_vx/sy_to_vy, these are mutating, in-place operations
    v_sx_to_vx: (xx) ->
      for x, idx in xx
        xx[idx] = x
      return xx
    v_sy_to_vy: (yy) ->
      canvas_height = @get('height')
      for y, idx in yy
        yy[idx] = canvas_height - y
      return yy

    _set_width: (width, update=true) ->
      if @_width_constraint?
        @solver.remove_constraint(@_width_constraint)
      @_width_constraint = new Constraint(new Expr(@_width, -width), EQ)
      @solver.add_constraint(@_width_constraint)
      if update
        @solver.update_variables()
      @new_bounds = true

    _set_height: (height, update=true) ->
      if @_height_constraint?
        @solver.remove_constraint(@_height_constraint)
      @_height_constraint = new Constraint(new Expr(@_height, -height), EQ)
      @solver.add_constraint(@_height_constraint)
      if update
        @solver.update_variables()
      @new_bounds = true

    _set_dims: (dims) ->
      @_set_width(dims[0], false)
      @_set_height(dims[1], false)
      @solver.update_variables()

    defaults: () ->
      return {
        canvas_width: 300
        canvas_height: 300
        map: false
        mousedown_callbacks: []
        mousemove_callbacks: []
        use_hidpi: true
      }

    display_defaults: () ->
      return { }

  class Canvases extends Backbone.Collection
    model: Canvas

  return {
    "Model": Canvas,
    "Collection": new Canvases(),
  }
