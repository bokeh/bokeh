define [
  "./collection",
  "kiwi",
  "./canvas_template"
  "./continuum_view",
  "./layout_box"
  "./logging"
  "./solver",
], (Collection, kiwi, canvas_template, ContinuumView, LayoutBox, Logging, Solver) ->

  Expr = kiwi.Expression
  Constraint = kiwi.Constraint
  EQ = kiwi.Operator.Eq

  logger = Logging.logger

  class CanvasView extends ContinuumView
    className: "bk-canvas-wrapper"
    template: canvas_template

    initialize: (options) ->
      super(options)

      template_data = {
        map: @mget('map')
      }
      html = @template(template_data)
      @$el.html(html)

      # for compat, to be removed
      @canvas_wrapper = @$el

      @canvas = @$('canvas.bk-canvas')
      @canvas_events = @$('div.bk-canvas-events')
      @canvas_overlay = @$('div.bk-canvas-overlays')
      @map_div = @$('div.bk-canvas-map') ? null

      logger.debug("CanvasView initialized")

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

      @$el.attr('style', "z-index: 50; width:#{width}px; height:#{height}px")
      @canvas.attr('style', "width:#{width}px;height:#{height}px")
      @canvas.attr('width', width*ratio).attr('height', height*ratio)
      @$el.attr("width", width).attr('height', height)

      @canvas_events.attr('style', "z-index:100; position:absolute; top:0; left:0; width:#{width}px; height:#{height}px;")
      @canvas_overlay.attr('style', "z-index:75; position:absolute; top:0; left:0; width:#{width}px; height:#{height}px;")

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
          # fake it til you make it
          textMetrics.ascent = ctx.html5MeasureText("m").width * 1.6
          return textMetrics

  class Canvas extends LayoutBox.Model
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

      logger.debug("Canvas initialized")

    # transform view coordinates to underlying screen coordinates
    vx_to_sx: (x) ->
      return x

    vy_to_sy: (y) ->
      # Note: +1 to account for 1px canvas dilation
      return @get('height') - (y + 1)

    # vectorized versions of vx_to_sx/vy_to_sy, these are mutating, in-place operations
    v_vx_to_sx: (xx) ->
      for x, idx in xx
        xx[idx] = x
      return xx

    v_vy_to_sy: (yy) ->
      canvas_height = @get('height')
      # Note: +1 to account for 1px canvas dilation
      for y, idx in yy
        yy[idx] = canvas_height - (y + 1)
      return yy

    # transform underlying screen coordinates to view coordinates
    sx_to_vx: (x) ->
      return x

    sy_to_vy: (y) ->
      # Note: +1 to account for 1px canvas dilation
      return @get('height') - (y + 1)

    # vectorized versions of sx_to_vx/sy_to_vy, these are mutating, in-place operations
    v_sx_to_vx: (xx) ->
      for x, idx in xx
        xx[idx] = x
      return xx

    v_sy_to_vy: (yy) ->
      canvas_height = @get('height')
      # Note: +1 to account for 1px canvas dilation
      for y, idx in yy
        yy[idx] = canvas_height - (y + 1)
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

    _set_dims: (dims, trigger=true) ->
      @_set_width(dims[0], false)
      @_set_height(dims[1], false)
      @solver.update_variables(trigger)

    defaults: ->
      return _.extend {}, super(), {
        width: 300
        height: 300
        map: false
        mousedown_callbacks: []
        mousemove_callbacks: []
        use_hidpi: true
      }

  class Canvases extends Collection
    model: Canvas

  return {
    "Model": Canvas,
    "Collection": new Canvases(),
  }
