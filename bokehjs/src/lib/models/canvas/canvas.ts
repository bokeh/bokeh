import {HasProps} from "core/has_props"
import {DOMView} from "core/dom_view"
import {logger} from "core/logging"
import * as p from "core/properties"
import {div, canvas} from "core/dom"
import {OutputBackend} from "core/enums"
import {BBox} from "core/util/bbox"
import {Context2d, SVGRenderingContext2D, fixup_ctx, get_scale_ratio} from "core/util/canvas"

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

  bbox: BBox

  _ctx: CanvasRenderingContext2D | SVGRenderingContext2D

  get ctx(): Context2d {
    return this._ctx as Context2d
  }

  canvas_el: HTMLCanvasElement | SVGSVGElement

  overlays_el: HTMLElement
  events_el: HTMLElement
  map_el: HTMLElement | null

  initialize(options: any): void {
    super.initialize(options)

    this.map_el = this.model.map ? this.el.appendChild(div({class: "bk-canvas-map"})) : null

    const style = {
      position: "absolute",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
    }

    switch (this.model.output_backend) {
      case "canvas":
      case "webgl": {
        this.canvas_el = this.el.appendChild(canvas({class: "bk-canvas", style}))
        const ctx = this.canvas_el.getContext('2d')
        if (ctx == null)
          throw new Error("unable to obtain 2D rendering context")
        this._ctx = ctx
        break
      }
      case "svg": {
        const ctx = new SVGRenderingContext2D()
        this._ctx = ctx
        this.canvas_el = this.el.appendChild(ctx.getSvg())
        break
      }
    }

    this.overlays_el = this.el.appendChild(div({class: "bk-canvas-overlays", style}))
    this.events_el   = this.el.appendChild(div({class: "bk-canvas-events", style}))

    fixup_ctx(this._ctx)

    logger.debug("CanvasView initialized")
  }

  get_canvas_element(): HTMLCanvasElement | SVGSVGElement {
    return this.canvas_el
  }

  prepare_canvas(width: number, height: number): void {
    // Ensure canvas has the correct size, taking HIDPI into account
    this.bbox = new BBox({left: 0, top: 0, width, height})

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
}

export namespace Canvas {
  export interface Attrs extends HasProps.Attrs {
    map: boolean
    use_hidpi: boolean
    pixel_ratio: number
    output_backend: OutputBackend
  }

  export interface Props extends HasProps.Props {}
}

export interface Canvas extends Canvas.Attrs {}

export class Canvas extends HasProps {

  properties: Canvas.Props

  constructor(attrs?: Partial<Canvas.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "Canvas"
    this.prototype.default_view = CanvasView

    this.internal({
      map:            [ p.Boolean,       false    ],
      use_hidpi:      [ p.Boolean,       true     ],
      pixel_ratio:    [ p.Number,        1        ],
      output_backend: [ p.OutputBackend, "canvas" ],
    })
  }
}
Canvas.initClass()
