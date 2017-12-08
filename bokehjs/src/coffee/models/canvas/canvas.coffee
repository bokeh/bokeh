import {LayoutCanvas} from "core/layout/layout_canvas"

import {DOMView} from "core/dom_view"
import {EQ} from "core/layout/solver"
import {logger} from "core/logging"
import * as p from "core/properties"
import {div, canvas} from "core/dom"
import {isEqual} from "core/util/eq"
import {Context2d, fixup_ctx, get_scale_ratio} from "core/util/canvas"

import * as canvas2svg from "canvas2svg"

# fixes up a problem with some versions of IE11
# ref: http://stackoverflow.com/questions/22062313/imagedata-set-in-internetexplorer
if window.CanvasPixelArray?
  CanvasPixelArray.prototype.set = (arr) ->
    for i in [0...@length]
      @[i] = arr[i]

export class CanvasView extends DOMView
  className: "bk-canvas-wrapper"

  `
  ctx: Context2d
  `

  initialize: (options) ->
    super(options)

    @map_el = if @model.map then @el.appendChild(div({class: "bk-canvas-map"})) else null

    switch @model.output_backend
      when "canvas", "webgl"
        @canvas_el = @el.appendChild(canvas({class: "bk-canvas"}))
        @_ctx = @canvas_el.getContext('2d')
      when "svg"
        @_ctx = new canvas2svg()
        @canvas_el = @el.appendChild(@_ctx.getSvg())

    @overlays_el = @el.appendChild(div({class: "bk-canvas-overlays"}))
    @events_el   = @el.appendChild(div({class: "bk-canvas-events"}))

    @ctx = @get_ctx()
    # work around canvas incompatibilities
    fixup_ctx(@ctx)

    logger.debug("CanvasView initialized")

  # Method exists so that context can be stubbed in unit tests
  get_ctx: () -> return @_ctx

  get_canvas_element: () -> return @canvas_el

  prepare_canvas: () ->
    # Ensure canvas has the correct size, taking HIDPI into account
    width = @model._width.value
    height = @model._height.value

    @el.style.width = "#{width}px"
    @el.style.height = "#{height}px"

    pixel_ratio = get_scale_ratio(@ctx, @model.use_hidpi, @model.output_backend)
    @model.pixel_ratio = pixel_ratio

    @canvas_el.style.width = "#{width}px"
    @canvas_el.style.height = "#{height}px"
    @canvas_el.setAttribute('width', width*pixel_ratio)
    @canvas_el.setAttribute('height', height*pixel_ratio)

    logger.debug("Rendering CanvasView with width: #{width}, height: #{height}, pixel ratio: #{pixel_ratio}")

  set_dims: ([width, height]) ->
    # XXX: for whatever reason we need to protect against those nonsense values,
    #      that appear in the middle of updating layout. Otherwise we would get
    #      all possible errors from the layout solver.
    if width == 0 or height == 0
      return

    if width != @model._width.value
      if @_width_constraint? and @solver.has_constraint(@_width_constraint)
        @solver.remove_constraint(@_width_constraint)

      @_width_constraint = EQ(@model._width, -width)
      @solver.add_constraint(@_width_constraint)

    if height != @model._height.value
      if @_height_constraint? and @solver.has_constraint(@_height_constraint)
        @solver.remove_constraint(@_height_constraint)

      @_height_constraint = EQ(@model._height, -height)
      @solver.add_constraint(@_height_constraint)

    @solver.update_variables()

export class Canvas extends LayoutCanvas
  type: 'Canvas'
  default_view: CanvasView

  @internal {
    map:            [ p.Boolean, false ]
    use_hidpi:      [ p.Boolean, true  ]
    pixel_ratio:    [ p.Number,  1     ]
    output_backend: [ p.OutputBackend, "canvas"]
  }

  @getters {
    panel: () -> @
  }
