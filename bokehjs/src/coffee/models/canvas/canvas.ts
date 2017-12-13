import {LayoutCanvas} from "core/layout/layout_canvas"

import {DOMView} from "core/dom_view"
import {EQ, Constraint} from "core/layout/solver"
import {logger} from "core/logging"
import * as p from "core/properties"
import {div, canvas} from "core/dom"
import {OutputBackend} from "core/enums"
import {Context2d, fixup_ctx, get_scale_ratio} from "core/util/canvas"

const canvas2svg = require("canvas2svg") // XXX: no typings

// fixes up a problem with some versions of IE11
// ref: http://stackoverflow.com/questions/22062313/imagedata-set-in-internetexplorer
if ((window as any).CanvasPixelArray != null) {
  (window as any).CanvasPixelArray.prototype.set = function(this: any, arr: any[]): void {
    for (let i = 0; i < this.length; i++) {
      this[i] = arr[i]
    }
  }
}

export class CanvasView extends DOMView {

  model: Canvas

  private _ctx: any
  ctx: Context2d

  canvas_el: HTMLCanvasElement

  overlays_el: HTMLElement
  events_el: HTMLElement
  map_el: HTMLElement | null

  protected _width_constraint: Constraint | undefined
  protected _height_constraint: Constraint | undefined

  initialize(options: any): void {
    super.initialize(options)

    this.map_el = this.model.map ? this.el.appendChild(div({class: "bk-canvas-map"})) : null

    switch (this.model.output_backend) {
      case "canvas":
      case "webgl":
        this.canvas_el = this.el.appendChild(canvas({class: "bk-canvas"}))
        this._ctx = this.canvas_el.getContext('2d')
        break
      case "svg":
        this._ctx = new canvas2svg()
        this.canvas_el = this.el.appendChild(this._ctx.getSvg())
        break
    }

    this.overlays_el = this.el.appendChild(div({class: "bk-canvas-overlays"}))
    this.events_el   = this.el.appendChild(div({class: "bk-canvas-events"}))

    this.ctx = this.get_ctx()
    // work around canvas incompatibilities
    fixup_ctx(this.ctx)

    logger.debug("CanvasView initialized")
  }

  // Method exists so that context can be stubbed in unit tests
  get_ctx(): Context2d {
    return this._ctx
  }

  get_canvas_element(): HTMLCanvasElement {
    return this.canvas_el
  }

  prepare_canvas(): void {
    // Ensure canvas has the correct size, taking HIDPI into account
    const width = this.model._width.value
    const height = this.model._height.value

    this.el.style.width = `${width}px`
    this.el.style.height = `${height}px`

    const pixel_ratio = get_scale_ratio(this.ctx, this.model.use_hidpi, this.model.output_backend)
    this.model.pixel_ratio = pixel_ratio

    this.canvas_el.style.width = `${width}px`
    this.canvas_el.style.height = `${height}px`

    // XXX: io.export and canvas2svg don't like this
    // this.canvas_el.width = width*pixel_ratio
    // this.canvas_el.height = height*pixel_ratio
    this.canvas_el.setAttribute("width", `${width*pixel_ratio}`)
    this.canvas_el.setAttribute("height", `${height*pixel_ratio}`)

    logger.debug(`Rendering CanvasView with width: ${width}, height: ${height}, pixel ratio: ${pixel_ratio}`)
  }

  set_dims([width, height]: [number, number]): void {
    // XXX: for whatever reason we need to protect against those nonsense values,
    //      that appear in the middle of updating layout. Otherwise we would get
    //      all possible errors from the layout solver.
    if (width == 0 || height == 0)
      return

    if (width != this.model._width.value) {
      if (this._width_constraint != null && this.solver.has_constraint(this._width_constraint))
        this.solver.remove_constraint(this._width_constraint)

      this._width_constraint = EQ(this.model._width, -width)
      this.solver.add_constraint(this._width_constraint)
    }

    if (height != this.model._height.value) {
      if (this._height_constraint != null && this.solver.has_constraint(this._height_constraint))
        this.solver.remove_constraint(this._height_constraint)

      this._height_constraint = EQ(this.model._height, -height)
      this.solver.add_constraint(this._height_constraint)
    }

    this.solver.update_variables()
  }
}

CanvasView.prototype.className = "bk-canvas-wrapper"

export class Canvas extends LayoutCanvas {

  map: boolean
  use_hidpi: boolean
  pixel_ratio: number
  output_backend: OutputBackend

  get panel() {
    return this
  }
}

Canvas.prototype.type = "Canvas"

Canvas.prototype.default_view = CanvasView

Canvas.internal({
  map:            [ p.Boolean,       false    ],
  use_hidpi:      [ p.Boolean,       true     ],
  pixel_ratio:    [ p.Number,        1        ],
  output_backend: [ p.OutputBackend, "canvas" ],
})
