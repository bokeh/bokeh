import * as _ from "underscore"

import canvas_template from "./canvas_template"
import {LayoutCanvas} from "../../core/layout/layout_canvas"

import {BokehView} from "../../core/bokeh_view"
import {GE, EQ} from "../../core/layout/solver"
import {logger} from "../../core/logging"
import * as p from "../../core/properties"
import {fixup_image_smoothing, fixup_line_dash, fixup_line_dash_offset, fixup_measure_text, get_scale_ratio, fixup_ellipse} from "../../core/util/canvas"

export class CanvasView extends BokehView
  className: "bk-canvas-wrapper"
  template: canvas_template

  initialize: (options) ->
    super(options)

    html = @template({ map: @model.map })
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

    # fixes up a problem with some versions of IE11
    # ref: http://stackoverflow.com/questions/22062313/imagedata-set-in-internetexplorer
    if window.CanvasPixelArray?
      CanvasPixelArray.prototype.set = (arr) ->
        for i in [0...@length]
            @[i] = arr[i]

    # map plots reference this attribute
    @map_div = @$el.find('div.bk-canvas-map') ? null
    @set_dims([@model.initial_width, @model.initial_height])
    logger.debug("CanvasView initialized")

  get_canvas_element: () ->
    return @$el.find('canvas.bk-canvas')[0]

  get_ctx: () ->
    canvas_el = @$el.find('canvas.bk-canvas')
    ctx = canvas_el[0].getContext('2d')
    return ctx

  prepare_canvas: (force=false) ->
    # Ensure canvas has the correct size, taking HIDPI into account

    width = @model._width._value
    height = @model._height._value
    dpr = window.devicePixelRatio

    # only resize the canvas when the canvas dimensions change unless force==true
    if not _.isEqual(@last_dims, [width, height, dpr]) or force

      @$el.css({
        width: width
        height:height
      })

      # Scale the canvas (this resets the context's state)
      @pixel_ratio = ratio = get_scale_ratio(@ctx, @model.use_hidpi)
      canvas_el = @$el.find('.bk-canvas')
      canvas_el.css({
        width: width
        height: height
      })
      canvas_el.attr('width', width*ratio)
      canvas_el.attr('height', height*ratio)

      logger.debug("Rendering CanvasView [force=#{force}] with width: #{width}, height: #{height}, ratio: #{ratio}")
      @model.pixel_ratio = @pixel_ratio
      @last_dims = [width, height, dpr]

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

    MIN_SIZE = 50
    if requested_width < MIN_SIZE or requested_height < MIN_SIZE
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

export class Canvas extends LayoutCanvas
  type: 'Canvas'
  default_view: CanvasView

  @internal {
    map: [ p.Boolean, false ]
    initial_width: [ p.Number ]
    initial_height: [ p.Number ]
    use_hidpi: [ p.Boolean, true ]
    pixel_ratio: [ p.Number ]
  }

  initialize: (attrs, options) ->
    super(attrs, options)
    @panel = @

  # transform view coordinates to underlying screen coordinates
  vx_to_sx: (x) -> x

  vy_to_sy: (y) ->
    # Note: +1 to account for 1px canvas dilation
    return @_height._value - (y + 1)

  # vectorized versions of vx_to_sx/vy_to_sy
  v_vx_to_sx: (xx) ->
    return new Float64Array(xx)

  v_vy_to_sy: (yy) ->
    _yy = new Float64Array(yy.length)
    height = @_height._value
    # Note: +1 to account for 1px canvas dilation
    for y, idx in yy
      _yy[idx] = height - (y + 1)
    return _yy

  sx_to_vx: (x) -> x

  sy_to_vy: (y) ->
    # Note: +1 to account for 1px canvas dilation
    return @_height._value - (y + 1)

  # vectorized versions of sx_to_vx/sy_to_vy
  v_sx_to_vx: (xx) ->
    return new Float64Array(xx)

  v_sy_to_vy: (yy) ->
    _yy = new Float64Array(yy.length)
    height = @_height._value
    # Note: +1 to account for 1px canvas dilation
    for y, idx in yy
      _yy[idx] = height - (y + 1)
    return _yy

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
