import {settings} from "core/settings"
import {logger} from "core/logging"
import type * as p from "core/properties"
import {div, px} from "core/dom"
import {OutputBackend} from "core/enums"
import {UIEventBus} from "core/ui_events"
import type {Context2d} from "core/util/canvas"
import {CanvasLayer} from "core/util/canvas"
import type {BBox} from "core/util/bbox"
import {UIElement, UIElementView} from "../ui/ui_element"
import type {PlotView} from "../plots/plot"
import type {WebGLState} from "./webgl"
import {global_webgl} from "./webgl"
import type {StyleSheetLike} from "core/dom"
import {InlineStyleSheet} from "core/dom"
import * as canvas_css from "styles/canvas.css"
import icons_css from "styles/icons.css"

// Shrink the shared canvas when it is more than 8× oversized in area or either
// dimension — enough headroom to retain capacity across typical mixed-size
// plot sequences, while reclaiming GPU memory after a large one-off paint.
const WEBGL_CANVAS_SHRINK_FACTOR = 8

export class CanvasView extends UIElementView {
  declare model: Canvas

  webgl: WebGLState | null = null

  underlays_el: HTMLElement
  primary: CanvasLayer
  overlays: CanvasLayer
  overlays_el: HTMLElement
  events_el: HTMLElement

  ui_event_bus: UIEventBus

  protected readonly _size = new InlineStyleSheet("", "size")

  readonly touch_action = new InlineStyleSheet("", "touch-action")

  /** Resize a canvas, setting the shrinking dimension first to minimize
   *  the transient intermediate area. Only assigns when the value changes. */
  private _resize_canvas(canvas: HTMLCanvasElement, w: number, h: number): void {
    if (h < canvas.height && w > canvas.width) {
      // Height shrinks while width grows — set height first
      if (canvas.height !== h) {
        canvas.height = h
      }
      if (canvas.width !== w) {
        canvas.width = w
      }
    } else {
      // Width shrinks (or both shrink/grow together) — set width first
      if (canvas.width !== w) {
        canvas.width = w
      }
      if (canvas.height !== h) {
        canvas.height = h
      }
    }
  }

  override initialize(): void {
    super.initialize()

    this.underlays_el = div({class: canvas_css.layer})
    this.primary = this.create_layer()
    this.overlays = this.create_layer()
    this.overlays_el = div({class: canvas_css.layer})
    this.events_el = div({class: [canvas_css.layer, canvas_css.events], tabIndex: 0})

    this.ui_event_bus = new UIEventBus(this)

    if (this.model.output_backend == "webgl") {
      this.webgl = global_webgl()
      if (settings.force_webgl && this.webgl == null) {
        throw new Error("webgl is not available")
      }
    }
  }

  get layers(): (HTMLElement | CanvasLayer)[] {
    return [
      this.underlays_el,
      this.primary,
      this.overlays,
      this.overlays_el,
      this.events_el,
    ]
  }

  override remove(): void {
    this.ui_event_bus.remove()
    super.remove()
  }

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), canvas_css.default, icons_css, this._size, this.touch_action]
  }

  override render(): void {
    super.render()

    const elements = [
      this.underlays_el,
      this.primary.el,
      this.overlays.el,
      this.overlays_el,
      this.events_el,
    ]

    this.shadow_el.append(...elements)
  }

  get pixel_ratio(): number {
    return this.primary.pixel_ratio
  }

  get pixel_ratio_changed(): boolean {
    return this.primary.pixel_ratio_changed
  }

  override _update_bbox(): boolean {
    const changed = super._update_bbox() || this.pixel_ratio_changed

    if (changed) {
      const {width, height} = this.bbox

      this._size.replace(`.${canvas_css.layer}`, {
        width: px(width),
        height: px(height),
      })

      this.primary.resize(width, height)
      this.overlays.resize(width, height)
    }

    return changed
  }

  override after_resize(): void {
    if (this.plot_views.length != 0) {
      // Canvas is being managed by a plot, thus it should not attempt
      // self-resize, as it would result in inconsistent state and
      // possibly invalid layout and/or lack of repaint of a plot.
      this.finish()
    } else {
      super.after_resize()
    }
  }

  override _after_resize(): void {
    super._after_resize()
    const {width, height} = this.bbox
    this.primary.resize(width, height)
    this.overlays.resize(width, height)
  }

  resize(): boolean {
    const changed = this._update_bbox()
    this._after_resize()
    return changed
  }

  prepare_webgl(frame_box: BBox): void {
    // Prepare WebGL for a drawing pass
    const {webgl} = this
    if (webgl != null) {
      // Retain capacity for mixed-size plots, but shrink if disproportionately oversized
      const {canvas} = webgl
      const gl = canvas.getContext("webgl")!
      const max_size: number = gl.getParameter(gl.MAX_TEXTURE_SIZE)
      const width = Math.min(this.primary.canvas.width, max_size)
      const height = Math.min(this.primary.canvas.height, max_size)
      if (width > 0 && height > 0) {
        if (
          canvas.width * canvas.height > WEBGL_CANVAS_SHRINK_FACTOR * width * height ||
          canvas.width > WEBGL_CANVAS_SHRINK_FACTOR * width ||
          canvas.height > WEBGL_CANVAS_SHRINK_FACTOR * height
        ) {
          this._resize_canvas(canvas, width, height)
        }
      }
      if (canvas.width < width || canvas.height < height) {
        this._resize_canvas(canvas, Math.max(canvas.width, width), Math.max(canvas.height, height))
        // Browsers also limit the area of drawing buffers, so fall back to this plot's size if exceeded
        if (gl.drawingBufferWidth < canvas.width || gl.drawingBufferHeight < canvas.height) {
          this._resize_canvas(canvas, width, height)
        }
      }
      // Match the canvas to the drawing buffer the browser actually allocated
      const {drawingBufferWidth, drawingBufferHeight} = gl
      if (drawingBufferWidth < canvas.width || drawingBufferHeight < canvas.height) {
        this._resize_canvas(canvas, drawingBufferWidth, drawingBufferHeight)
      }
      this._clear_webgl()
      const {x: sx, y: sy, width: w, height: h} = frame_box
      const {xview, yview} = this.bbox
      const vx = xview.compute(sx)
      const vy = yview.compute(sy + h)
      const ratio = this.pixel_ratio
      webgl.regl_wrapper.set_scissor(ratio*vx, ratio*vy, ratio*w, ratio*h)
    }
  }

  // A renderer may already have composited its WebGL passes.
  private _webgl_dirty = false

  mark_webgl_dirty(): void {
    this._webgl_dirty = true
  }

  blit_webgl(ctx: Context2d): void {
    const {webgl} = this
    if (this._webgl_dirty && webgl != null && webgl.canvas.width*webgl.canvas.height > 0) {
      logger.debug("Blitting WebGL canvas")
      // Copy in device pixels while preserving any clip on the destination.
      ctx.save()
      try {
        ctx.resetTransform()
        // GL draws into the viewport in the bottom-left corner of the shared canvas.
        const {width, height} = this.primary.canvas
        const {width: vw = 0, height: vh = 0} = webgl.regl_wrapper.viewport
        ctx.drawImage(webgl.canvas, 0, webgl.canvas.height - vh, vw, vh, 0, 0, width, height)
      } finally {
        ctx.restore()
        this._clear_webgl()
      }
    }
  }

  protected _clear_webgl(): void {
    this._webgl_dirty = false
    const {webgl} = this
    if (webgl != null) {
      // Prepare GL for drawing
      const {width, height} = this.primary.canvas
      webgl.regl_wrapper.clear(width, height)
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
    return new CanvasLayer(this.model.output_backend)
  }

  create_layer_svg(): CanvasLayer {
    return new CanvasLayer("svg")
  }

  to_blob(): Promise<Blob> {
    return this.compose().to_blob()
  }

  plot_views: PlotView[] = []
  /*
  get plot_views(): PlotView[] {
    return [] // XXX
  }
  */
}

export namespace Canvas {
  export type Attrs = p.AttrsOf<Props>

  export type Props = UIElement.Props & {
    output_backend: p.Property<OutputBackend>
  }
}

export interface Canvas extends Canvas.Attrs {}

export class Canvas extends UIElement {
  declare properties: Canvas.Props
  declare __view_type__: CanvasView

  static {
    this.prototype.default_view = CanvasView

    this.define<Canvas.Props>(() => ({
      output_backend: [ OutputBackend, "canvas" ],
    }))
  }
}
