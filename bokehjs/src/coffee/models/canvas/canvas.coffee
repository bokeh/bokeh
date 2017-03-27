import {LayoutCanvas} from "core/layout/layout_canvas"

import {DOMView} from "core/dom_view"
import {GE, EQ} from "core/layout/solver"
import {logger} from "core/logging"
import * as p from "core/properties"
import {div, canvas} from "core/dom"
import {isEqual} from "core/util/eq"
import {fixup_ctx, get_scale_ratio} from "core/util/canvas"

# fixes up a problem with some versions of IE11
# ref: http://stackoverflow.com/questions/22062313/imagedata-set-in-internetexplorer
if window.CanvasPixelArray?
  CanvasPixelArray.prototype.set = (arr) ->
    for i in [0...@length]
      @[i] = arr[i]

export class CanvasView extends DOMView
  className: "bk-canvas-wrapper"

  initialize: (options) ->
    super(options)

    @map_el      = if @model.map then @el.appendChild(div({class: "bk-canvas-map"})) else null
    @events_el   = @el.appendChild(div({class: "bk-canvas-events"}))
    @overlays_el = @el.appendChild(div({class: "bk-canvas-overlays"}))
    @canvas_el   = @el.appendChild(canvas({class: "bk-canvas"}))

    # create the canvas context that gets passed around for drawing
    @ctx = @get_ctx()

    # work around canvas incompatibilities
    fixup_ctx(@ctx)

    @set_dims([@model.initial_width, @model.initial_height], false)
    logger.debug("CanvasView initialized")

    @listenTo(@solver, "layout_reset", () => @_add_constraints())

  get_canvas_element: () -> @canvas_el

  get_ctx: () ->
    return @canvas_el.getContext('2d')

  prepare_canvas: () ->
    # Ensure canvas has the correct size, taking HIDPI into account
    width = @model._width._value
    height = @model._height._value
    dpr = window.devicePixelRatio

    # only resize the canvas when the canvas dimensions change
    if not isEqual(@last_dims, [width, height, dpr])
      @el.style.width = "#{width}px"
      @el.style.height = "#{height}px"

      # Scale the canvas (this resets the context's state)
      @pixel_ratio = ratio = get_scale_ratio(@ctx, @model.use_hidpi)
      @canvas_el.style.width = "#{width}px"
      @canvas_el.style.height = "#{height}px"
      @canvas_el.setAttribute('width', width*ratio)
      @canvas_el.setAttribute('height', height*ratio)

      logger.debug("Rendering CanvasView with width: #{width}, height: #{height}, ratio: #{ratio}")
      @model.pixel_ratio = @pixel_ratio
      @last_dims = [width, height, dpr]

  set_dims: (dims, trigger=true) ->
    @requested_width = dims[0]
    @requested_height = dims[1]
    @update_constraints(trigger)
    return

  update_constraints: (trigger) ->
    requested_width = @requested_width
    requested_height = @requested_height

    if not requested_width? or not requested_height?
      return

    MIN_SIZE = 50
    if requested_width < MIN_SIZE or requested_height < MIN_SIZE
      return

    if isEqual(@last_requested_dims, [requested_width, requested_height])
      return

    if @_width_constraint?
      @solver.remove_constraint(@_width_constraint, true)
    if @_height_constraint?
      @solver.remove_constraint(@_height_constraint, true)

    @_add_constraints()

    @last_requested_dims = [requested_width, requested_height]

    @solver.update_variables(trigger)

  _add_constraints: () ->
    @_width_constraint = EQ(@model._width, -@requested_width)
    @solver.add_constraint(@_width_constraint)

    @_height_constraint = EQ(@model._height, -@requested_height)
    @solver.add_constraint(@_height_constraint)

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
    return super().concat([
      GE(@_top),
      GE(@_bottom),
      GE(@_left),
      GE(@_right),
      GE(@_width),
      GE(@_height),
      EQ(@_width, [-1, @_right]),
      EQ(@_height, [-1, @_top]),
    ])
