import {settings} from "core/settings"
import {logger} from "core/logging"
import type * as p from "core/properties"
import {div, append} from "core/dom"
import {OutputBackend} from "core/enums"
import {UIEventBus} from "core/ui_events"
import {load_module} from "core/util/modules"
import type {Context2d} from "core/util/canvas"
import {CanvasLayer} from "core/util/canvas"
import {UIElement, UIElementView} from "../ui/ui_element"
import type {PlotView} from "../plots/plot"
import type {ReglWrapper} from "../glyphs/webgl/regl_wrap"
import type {StyleSheetLike} from "core/dom"
import {InlineStyleSheet} from "core/dom"
import canvas_css from "styles/canvas.css"
import icons_css from "styles/icons.css"

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
  readonly regl_wrapper: ReglWrapper
}

async function init_webgl(): Promise<WebGLState | null> {
  // We use a global invisible canvas and gl context. By having a global context,
  // we avoid the limitation of max 16 contexts that most browsers have.
  const canvas = document.createElement("canvas")
  const gl = canvas.getContext(
    "webgl", {alpha: true, antialias: false, depth: false, premultipliedAlpha: true},
  )

  // If WebGL is available, we store a reference to the ReGL wrapper on
  // the ctx object, because that's what gets passed everywhere.
  if (gl != null) {
    const webgl = await load_module(import("../glyphs/webgl"))
    if (webgl != null) {
      const regl_wrapper = webgl.get_regl(gl)
      if (regl_wrapper.has_webgl) {
        return {canvas, regl_wrapper}
      } else {
        logger.trace("WebGL is supported, but not the required extensions")
      }
    } else {
      logger.trace("WebGL is supported, but bokehjs(.min).js bundle is not available")
    }
  } else {
    logger.trace("WebGL is not supported")
  }

  return null
}

const global_webgl: () => Promise<WebGLState | null> = (() => {
  let _global_webgl: WebGLState | null | undefined
  return async () => {
    if (_global_webgl !== undefined) {
      return _global_webgl
    } else {
      return _global_webgl = await init_webgl()
    }
  }
})()

export class CanvasView extends UIElementView {
  declare model: Canvas

  webgl: WebGLState | null = null

  underlays_el: HTMLElement
  primary: CanvasLayer
  overlays: CanvasLayer
  overlays_el: HTMLElement
  events_el: HTMLElement

  ui_event_bus: UIEventBus

  protected _size = new InlineStyleSheet()

  override initialize(): void {
    super.initialize()

    this.underlays_el = div({class: "bk-layer"})
    this.primary = this.create_layer()
    this.overlays = this.create_layer()
    this.overlays_el = div({class: "bk-layer"})
    this.events_el = div({class: ["bk-layer", "bk-events"]})

    this.ui_event_bus = new UIEventBus(this)
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

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()

    if (this.model.output_backend == "webgl") {
      this.webgl = await global_webgl()
      if (settings.force_webgl && this.webgl == null) {
        throw new Error("webgl is not available")
      }
    }
  }

  override remove(): void {
    this.ui_event_bus.destroy()
    super.remove()
  }

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), canvas_css, icons_css, this._size]
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

    append(this.shadow_el, ...elements)
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

  override _update_bbox(): boolean {
    const changed = super._update_bbox()

    if (changed) {
      const {width, height} = this.bbox

      this._size.replace(`
      .bk-layer {
        width: ${width}px;
        height: ${height}px;
      }
      `)

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
      return
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

  resize(): void {
    this._update_bbox()
    this._after_resize()
  }

  prepare_webgl(frame_box: FrameBox): void {
    // Prepare WebGL for a drawing pass
    const {webgl} = this
    if (webgl != null) {
      // Sync canvas size
      const {width, height} = this.bbox
      webgl.canvas.width = this.pixel_ratio*width
      webgl.canvas.height = this.pixel_ratio*height
      const [sx, sy, w, h] = frame_box
      const {xview, yview} = this.bbox
      const vx = xview.compute(sx)
      const vy = yview.compute(sy + h)
      const ratio = this.pixel_ratio
      webgl.regl_wrapper.set_scissor(ratio*vx, ratio*vy, ratio*w, ratio*h)
      this._clear_webgl()
    }
  }

  blit_webgl(ctx: Context2d): void {
    // This should be called when the ctx has no state except the HIDPI transform
    const {webgl} = this
    if (webgl != null && webgl.canvas.width*webgl.canvas.height > 0) {
      // Blit gl canvas into the 2D canvas. To do 1-on-1 blitting, we need
      // to remove the hidpi transform, then blit, then restore.
      // ctx.globalCompositeOperation = "source-over"  -> OK; is the default
      logger.debug("Blitting WebGL canvas")
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
      const {regl_wrapper, canvas} = webgl
      regl_wrapper.clear(canvas.width, canvas.height)
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
    hidpi: p.Property<boolean>
    output_backend: p.Property<OutputBackend>
  }
}

export interface Canvas extends Canvas.Attrs {}

export class Canvas extends UIElement {
  declare properties: Canvas.Props
  declare __view_type__: CanvasView

  constructor(attrs?: Partial<Canvas.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = CanvasView

    this.define<Canvas.Props>(({Boolean}) => ({
      hidpi:          [ Boolean, true ],
      output_backend: [ OutputBackend, "canvas" ],
    }))
  }
}
