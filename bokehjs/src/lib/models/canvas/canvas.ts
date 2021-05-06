import {HasProps} from "core/has_props"
import {DOMView} from "core/dom_view"
import {logger} from "core/logging"
import * as p from "core/properties"
import {div, append} from "core/dom"
import {OutputBackend} from "core/enums"
import {extend} from "core/util/object"
import {UIEventBus} from "core/ui_events"
import {BBox} from "core/util/bbox"
import {Context2d, CanvasLayer} from "core/util/canvas"
import {PlotView} from "../plots/plot"

export type FrameBox = [number, number, number, number]

// Notes on WebGL support:
// Glyps can be rendered into the original 2D canvas, or in a (hidden)
// webgl canvas that we create below. In this way, the rest of bokehjs
// can keep working as it is, and we can incrementally update glyphs to
// make them use GL.
//
// When the author or user wants to, we try to create a webgl canvas,
// which is saved on the ctx object that gets passed around during drawing.
// The presence (and not-being-false) of the this.glcanvas attribute is the
// marker that we use throughout that determines whether we have gl support.

export type WebGLState = {
  readonly canvas: HTMLCanvasElement
  readonly gl: WebGLRenderingContext
}

const global_webgl: WebGLState | undefined = (() => {
  // We use a global invisible canvas and gl context. By having a global context,
  // we avoid the limitation of max 16 contexts that most browsers have.
  const canvas = document.createElement("canvas")
  const gl = canvas.getContext("webgl", {premultipliedAlpha: true})

  // If WebGL is available, we store a reference to the gl canvas on
  // the ctx object, because that's what gets passed everywhere.
  if (gl != null)
    return {canvas, gl}
  else {
    logger.trace("WebGL is not supported")
    return undefined
  }
})()

const style = {
  position: "absolute",
  top: "0",
  left: "0",
  width: "100%",
  height: "100%",
}

export class CanvasView extends DOMView {
  override model: Canvas
  override el: HTMLElement

  bbox: BBox = new BBox()

  webgl?: WebGLState

  underlays_el: HTMLElement
  primary: CanvasLayer
  overlays: CanvasLayer
  overlays_el: HTMLElement
  events_el: HTMLElement

  ui_event_bus: UIEventBus

  override initialize(): void {
    super.initialize()

    if (this.model.output_backend == "webgl") {
      this.webgl = global_webgl
    }

    this.underlays_el = div({style})
    this.primary = this.create_layer()
    this.overlays = this.create_layer()
    this.overlays_el = div({style})
    this.events_el = div({style})

    const elements = [
      this.underlays_el,
      this.primary.el,
      this.overlays.el,
      this.overlays_el,
      this.events_el,
    ]

    extend(this.el.style, style)
    append(this.el, ...elements)

    this.ui_event_bus = new UIEventBus(this)
  }

  override remove(): void {
    this.ui_event_bus.destroy()
    super.remove()
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

  get pixel_ratio(): number {
    return this.primary.pixel_ratio // XXX: primary
  }

  resize(width: number, height: number): void {
    this.bbox = new BBox({left: 0, top: 0, width, height})

    this.primary.resize(width, height)
    this.overlays.resize(width, height)
  }

  prepare_webgl(frame_box: FrameBox): void {
    // Prepare WebGL for a drawing pass
    const {webgl} = this
    if (webgl != null) {
      // Sync canvas size
      const {width, height} = this.bbox
      webgl.canvas.width = this.pixel_ratio*width
      webgl.canvas.height = this.pixel_ratio*height
      const {gl} = webgl
      // Clipping
      gl.enable(gl.SCISSOR_TEST)
      const [sx, sy, w, h] = frame_box
      const {xview, yview} = this.bbox
      const vx = xview.compute(sx)
      const vy = yview.compute(sy + h)
      const ratio = this.pixel_ratio
      gl.scissor(ratio*vx, ratio*vy, ratio*w, ratio*h) // lower left corner, width, height
      this._clear_webgl()
    }
  }

  blit_webgl(ctx: Context2d): void {
    // This should be called when the ctx has no state except the HIDPI transform
    const {webgl} = this
    if (webgl != null) {
      // Blit gl canvas into the 2D canvas. To do 1-on-1 blitting, we need
      // to remove the hidpi transform, then blit, then restore.
      // ctx.globalCompositeOperation = "source-over"  -> OK; is the default
      logger.debug('Blitting WebGL canvas')
      ctx.restore()
      ctx.drawImage(webgl.canvas, 0, 0)
      // Set back hidpi transform
      ctx.save()
      if (this.model.hidpi) {
        const ratio = this.pixel_ratio
        ctx.scale(ratio, ratio)
        ctx.translate(0.5, 0.5)
      }
      this._clear_webgl()
    }
  }

  protected _clear_webgl(): void {
    const {webgl} = this
    if (webgl != null) {
      // Prepare GL for drawing
      const {gl, canvas} = webgl
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    }
  }

  compose(): CanvasLayer {
    const composite = this.create_layer()
    const {width, height} = this.bbox
    composite.resize(width, height)
    composite.ctx.drawImage(this.primary.canvas, 0, 0)
    composite.ctx.drawImage(this.overlays.canvas, 0, 0)
    return composite
  }

  create_layer(): CanvasLayer {
    const {output_backend, hidpi} = this.model
    return new CanvasLayer(output_backend, hidpi)
  }

  to_blob(): Promise<Blob> {
    return this.compose().to_blob()
  }

  plot_views: PlotView[]
  /*
  get plot_views(): PlotView[] {
    return [] // XXX
  }
  */
}

export namespace Canvas {
  export type Attrs = p.AttrsOf<Props>

  export type Props = HasProps.Props & {
    hidpi: p.Property<boolean>
    output_backend: p.Property<OutputBackend>
  }
}

export interface Canvas extends Canvas.Attrs {}

export class Canvas extends HasProps {
  override properties: Canvas.Props
  override __view_type__: CanvasView

  constructor(attrs?: Partial<Canvas.Attrs>) {
    super(attrs)
  }

  static init_Canvas(): void {
    this.prototype.default_view = CanvasView

    this.internal<Canvas.Props>(({Boolean}) => ({
      hidpi:          [ Boolean, true ],
      output_backend: [ OutputBackend, "canvas" ],
    }))
  }
}
