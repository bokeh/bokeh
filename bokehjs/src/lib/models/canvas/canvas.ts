import {HasProps} from "core/has_props"
import {DOMView} from "core/dom_view"
import {logger} from "core/logging"
import * as p from "core/properties"
import {div, canvas, append} from "core/dom"
import {OutputBackend} from "core/enums"
import {BBox} from "core/util/bbox"
import {Context2d, fixup_ctx, get_scale_ratio} from "core/util/canvas"
import {bk_canvas, bk_canvas_underlays, bk_canvas_overlays, bk_canvas_events} from "styles/canvas"

const canvas2svg = require("canvas2svg")

type SVGRenderingContext2D = {
  getSvg(): SVGSVGElement
  getSerializedSvg(fix_named_entities: boolean): string
}

export class CanvasView extends DOMView {
  model: Canvas

  bbox: BBox

  private _ctx: CanvasRenderingContext2D | SVGRenderingContext2D

  get ctx(): Context2d {
    return this._ctx as Context2d
  }

  protected underlays_el: HTMLElement
  protected canvas_el: HTMLCanvasElement | SVGSVGElement
  protected overlays_el: HTMLElement
  /*protected*/ events_el: HTMLElement

  initialize(): void {
    super.initialize()

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
        this.canvas_el = canvas({class: bk_canvas, style})
        const ctx = this.canvas_el.getContext('2d')
        if (ctx == null)
          throw new Error("unable to obtain 2D rendering context")
        this._ctx = ctx
        break
      }
      case "svg": {
        const ctx = new canvas2svg() as SVGRenderingContext2D
        this._ctx = ctx
        this.canvas_el = ctx.getSvg()
        break
      }
    }

    this.underlays_el = div({class: bk_canvas_underlays, style})
    this.overlays_el = div({class: bk_canvas_overlays, style})
    this.events_el = div({class: bk_canvas_events, style})

    append(this.el, this.underlays_el, this.canvas_el, this.overlays_el, this.events_el)

    fixup_ctx(this._ctx)

    logger.debug("CanvasView initialized")
  }

  add_underlay(el: HTMLElement): void {
    this.underlays_el.appendChild(el)
  }

  add_overlay(el: HTMLElement): void {
    this.overlays_el.appendChild(el)
  }

  add_event(el: HTMLElement): void {
    this.events_el.appendChild(el)
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

  save(name: string): void {
    if (this.canvas_el instanceof HTMLCanvasElement) {
      const canvas = this.canvas_el
      if (canvas.msToBlob != null) {
        const blob = canvas.msToBlob()
        window.navigator.msSaveBlob(blob, name)
      } else {
        const link = document.createElement("a")
        link.href = canvas.toDataURL("image/png")
        link.download = name + ".png"
        link.target = "_blank"
        link.dispatchEvent(new MouseEvent("click"))
      }
    } else {
      const ctx = this._ctx as SVGRenderingContext2D
      const svg = ctx.getSerializedSvg(true)
      const svgblob = new Blob([svg], {type: "text/plain"})
      const downloadLink = document.createElement("a")
      downloadLink.download = name + ".svg"
      downloadLink.innerHTML = "Download svg"
      downloadLink.href = window.URL.createObjectURL(svgblob)
      downloadLink.onclick = (event) => document.body.removeChild(event.target as HTMLElement)
      downloadLink.style.display = "none"
      document.body.appendChild(downloadLink)
      downloadLink.click()
    }
  }
}

export namespace Canvas {
  export type Attrs = p.AttrsOf<Props>

  export type Props = HasProps.Props & {
    use_hidpi: p.Property<boolean>
    pixel_ratio: p.Property<number>
    output_backend: p.Property<OutputBackend>
  }
}

export interface Canvas extends Canvas.Attrs {}

export class Canvas extends HasProps {
  properties: Canvas.Props

  constructor(attrs?: Partial<Canvas.Attrs>) {
    super(attrs)
  }

  static init_Canvas(): void {
    this.prototype.default_view = CanvasView

    this.internal({
      use_hidpi:      [ p.Boolean,       true     ],
      pixel_ratio:    [ p.Number,        1        ],
      output_backend: [ p.OutputBackend, "canvas" ],
    })
  }
}
