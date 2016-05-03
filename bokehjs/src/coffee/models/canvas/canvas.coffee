_ = require "underscore"

canvas_template = require "./canvas_template"
LayoutCanvas = require "../../core/layout/layout_canvas"

BokehView = require "../../core/bokeh_view"
{GE, EQ} = require "../../core/layout/solver"
{logger} = require "../../core/logging"
p = require "../../core/properties"
{fixup_image_smoothing, fixup_line_dash, fixup_line_dash_offset, fixup_measure_text, get_scale_ratio, fixup_ellipse} = require "../../core/util/canvas"

class CanvasView extends BokehView
  className: "bk-canvas-wrapper"
  template: canvas_template

  initialize: (options) ->
    super(options)

    html = @template({ map: @mget('map') })
    @$el.html(html)

    # create the canvas context that gets passed around for drawing
    @ctx = @get_ctx()

    # init without webgl support (can be overriden in plot.coffee)
    @ctx.glcanvas = null

    # work around canvas incompatibilities
    fixup_line_dash(@ctx)
    fixup_line_dash_offset(@ctx)
    fixup_image_smoothing(@ctx)
    fixup_measure_text(@ctx)
    fixup_ellipse(@ctx)

    # map plots reference this attribute
    @map_div = @$('div.bk-canvas-map') ? null

    @set_dims([@mget('canvas_width'), @mget('canvas_height')])

    logger.debug("CanvasView initialized")

  get_ctx: () ->
    canvas_el = @$('canvas.bk-canvas')
    ctx = canvas_el[0].getContext('2d')
    return ctx

  render: (force=false) ->

    width = @mget('width')
    height = @mget('height')

    # only render the canvas when the canvas dimensions change unless force==true
    if not _.isEqual(@last_dims, [width, height]) or force

      ratio = get_scale_ratio(@ctx, @mget('use_hidpi'))

      logger.debug("Rendering CanvasView [force=#{force}] with width: #{width}, height: #{height}, ratio: #{ratio}")

      canvas_el = @$('canvas.bk-canvas')
      canvas_el.attr('style', "width:#{width}px; height:#{height}px")
      canvas_el.attr('width', width*ratio).attr('height', height*ratio)

      @$el.attr('style', "z-index: 50; width:#{width}px; height:#{height}px")
      @$el.attr("width", width).attr('height', height)

      @$('div.bk-canvas-overlays').attr('style', "z-index:75; position:absolute; top:0; left:0; width:#{width}px; height:#{height}px;")
      @$('div.bk-canvas-events').attr('style', "z-index:100; position:absolute; top:0; left:0; width:#{width}px; height:#{height}px;")

      @ctx.scale(ratio, ratio)
      @ctx.translate(0.5, 0.5)

      @last_dims = [width, height]

    return

  set_dims: (dims, trigger=true) ->
    @requested_width = dims[0]
    @requested_height = dims[1]
    @update_constraints(trigger)
    return

  update_constraints: (trigger=true) ->
    requested_width = @requested_width
    requested_height = @requested_height

    if not requested_width? or not requested_height?
      return

    if _.isEqual(@last_requested_dims, [requested_width, requested_height])
      return

    s = @model.document.solver()

    if @_width_constraint?
      s.remove_constraint(@_width_constraint)
    @_width_constraint = EQ(@model._width, -requested_width)
    s.add_constraint(@_width_constraint)

    if @_height_constraint?
      s.remove_constraint(@_height_constraint)
    @_height_constraint = EQ(@model._height, -requested_height)
    s.add_constraint(@_height_constraint)

    @last_requested_dims = [requested_width, requested_height]

    s.update_variables(trigger)

class Canvas extends LayoutCanvas.Model
  type: 'Canvas'
  default_view: CanvasView

  @internal {
    map: [ p.Boolean, false ]
    canvas_width: [ p.Number ]
    canvas_height: [ p.Number ]
    use_hidpi: [ p.Boolean, true ]
  }

  initialize: (attrs, options) ->
    super(attrs, options)
    @panel = @

  # transform view coordinates to underlying screen coordinates
  vx_to_sx: (x) -> x

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
  sx_to_vx: (x) -> x

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

  get_constraints: () ->
    constraints = super()
    constraints.push(GE(@_top))
    constraints.push(GE(@_bottom))
    constraints.push(GE(@_left))
    constraints.push(GE(@_right))
    constraints.push(GE(@_width))
    constraints.push(GE(@_height))
    constraints.push(EQ(@_width, [-1, @_right]))
    constraints.push(EQ(@_height, [-1, @_top]))
    return constraints

module.exports =
  Model: Canvas
  View: CanvasView
