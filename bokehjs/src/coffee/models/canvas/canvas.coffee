_ = require "underscore"

canvas_template = require "./canvas_template"
LayoutBox = require "./layout_box"

BokehView = require "../../core/bokeh_view"
{EQ} = require "../../core/layout/solver"
{logger} = require "../../core/logging"
{fixup_image_smoothing, fixup_line_dash, fixup_line_dash_offset, fixup_measure_text, get_scale_ratio} = require "../../core/util/canvas"

class CanvasView extends BokehView
  className: "bk-canvas-wrapper"
  template: canvas_template

  initialize: (options) ->
    super(options)

    html = @template({ map: @mget('map') })
    @$el.html(html)

    # create the canvas DOM element, various renderers reference this attribute
    @canvas = @$('canvas.bk-canvas')

    # create the canvas context that gets passed around for drawing
    @ctx = @canvas[0].getContext('2d')

    # init without webgl support (can be overriden in plot.coffee)
    @ctx.glcanvas = null

    # work around canvas incompatibilities
    fixup_line_dash(@ctx)
    fixup_line_dash_offset(@ctx)
    fixup_image_smoothing(@ctx)
    fixup_measure_text(@ctx)

    # map plots reference this attribute
    @map_div = @$('div.bk-canvas-map') ? null

    logger.debug("CanvasView initialized")

  render: (force=false) ->

    width = @mget('width')
    height = @mget('height')

    # only render the canvas when the canvas dimensions change unless force==true
    if not _.isEqual(@last_dims, [width, height]) or force

      ratio = get_scale_ratio(@ctx, @mget('use_hidpi'))

      logger.debug("Rendering CanvasView [force=#{force}] with width: #{width}, height: #{height}, ratio: #{ratio}")

      @canvas.attr('style', "width:#{width}px; height:#{height}px")
      @canvas.attr('width', width*ratio).attr('height', height*ratio)

      @$el.attr('style', "z-index: 50; width:#{width}px; height:#{height}px")
      @$el.attr("width", width).attr('height', height)

      @$('div.bk-canvas-overlays').attr('style', "z-index:75; position:absolute; top:0; left:0; width:#{width}px; height:#{height}px;")
      @$('div.bk-canvas-events').attr('style', "z-index:100; position:absolute; top:0; left:0; width:#{width}px; height:#{height}px;")

      @ctx.scale(ratio, ratio)
      @ctx.translate(0.5, 0.5)

      @last_dims = [width, height]

    return

class Canvas extends LayoutBox.Model
  type: 'Canvas'
  default_view: CanvasView

  defaults: ->
    return _.extend {}, super(), {
      map: false
      use_hidpi: true
    }

  initialize: (attrs, options) ->
    super(attrs, options)
    @panel = @

  set_dims: (dims, trigger=true) ->
    @_set_width(dims[0])
    @_set_height(dims[1])
    @document.solver().update_variables(trigger)
    return

  _doc_attached: () ->
    super()
    solver = @document.solver()
    solver.add_constraint(EQ(@_left))
    solver.add_constraint(EQ(@_bottom))
    @set_dims([@get('canvas_width'), @get('canvas_height')])
    logger.debug("Canvas attached to document")

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

  _set_width: (width) ->
    solver = @document.solver()
    if @_width_constraint?
      solver.remove_constraint(@_width_constraint)
    @_width_constraint = EQ(@_width, -width)
    solver.add_constraint(@_width_constraint)
    solver.update_variables()
    return

  _set_height: (height) ->
    solver = @document.solver()
    if @_height_constraint?
      solver.remove_constraint(@_height_constraint)
    @_height_constraint = EQ(@_height, -height)
    solver.add_constraint(@_height_constraint)
    solver.update_variables()
    return

  _set_dims: (dims, trigger=true) ->
    logger.warn("_set_dims is deprecated, use set_dims")
    @set_dims(dims, trigger)
    return

module.exports =
  Model: Canvas
