import {logger} from "core/logging"
import * as p from "core/properties"
import {div, canvas, append} from "core/dom"
import {extend} from "core/util/object"
import {OutputBackend, RenderLevel} from "core/enums"
import {UIEventBus} from "core/ui_events"
import {LODStart, LODEnd} from "core/bokeh_events"
import {BBox} from "core/util/bbox"
import {Context2d, fixup_ctx} from "core/util/canvas"
import {SVGRenderingContext2D} from "core/util/svg"
import {PlotView} from "../plots/plot"
import {Renderer, RendererView} from "../renderers/renderer"
import {throttle} from "core/util/throttle"
import {Box} from "core/types"
import {LayoutDOM, LayoutDOMView} from "../layouts/layout_dom"
import {LayoutItem} from "core/layout/layoutable"

import type {Plot} from "../plots/plot"
export type InteractiveRenderer = Plot

export type PaintableView = PlotView | RendererView

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

export class CanvasLayer {
  private readonly _canvas: HTMLCanvasElement | SVGSVGElement
  get canvas(): HTMLCanvasElement {
    return this._canvas as HTMLCanvasElement
  }

  private readonly _ctx: CanvasRenderingContext2D | SVGRenderingContext2D
  get ctx(): Context2d {
    return this._ctx as Context2d
  }

  private readonly _el: HTMLElement
  get el(): HTMLElement {
    return this._el
  }

  readonly pixel_ratio: number = 1

  bbox: BBox = new BBox()

  constructor(readonly backend: OutputBackend, readonly hidpi: boolean) {
    switch (backend) {
      case "webgl":
      case "canvas": {
        this._el = this._canvas = canvas({style})
        const ctx = this.canvas.getContext('2d')
        if (ctx == null)
          throw new Error("unable to obtain 2D rendering context")
        this._ctx = ctx
        if (hidpi) {
          this.pixel_ratio = devicePixelRatio
        }
        break
      }
      case "svg": {
        const ctx = new SVGRenderingContext2D()
        this._ctx = ctx
        this._canvas = ctx.get_svg()
        this._el = div({style}, this._canvas)
        break
      }
    }

    fixup_ctx(this._ctx)
  }

  resize(width: number, height: number): void {
    this.bbox = new BBox({left: 0, top: 0, width, height})

    const target = this._ctx instanceof SVGRenderingContext2D ? this._ctx : this.canvas
    target.width = width*this.pixel_ratio
    target.height = height*this.pixel_ratio
  }

  prepare(): void {
    const {ctx, hidpi, pixel_ratio} = this
    ctx.save()
    if (hidpi) {
      ctx.scale(pixel_ratio, pixel_ratio)
      ctx.translate(0.5, 0.5)
    }
    this.clear()
  }

  clear(): void {
    const {x, y, width, height} = this.bbox
    this.ctx.clearRect(x, y, width, height)
  }

  finish(): void {
    this.ctx.restore()
  }

  save(name: string): void {
    const {_canvas} = this
    if (_canvas instanceof HTMLCanvasElement) {
      if (_canvas.msToBlob != null) {
        const blob = _canvas.msToBlob()
        window.navigator.msSaveBlob(blob, name)
      } else {
        const link = document.createElement("a")
        link.href = _canvas.toDataURL("image/png")
        link.download = name + ".png"
        link.target = "_blank"
        link.dispatchEvent(new MouseEvent("click"))
      }
    } else {
      const ctx = this._ctx as SVGRenderingContext2D
      const svg = ctx.get_serialized_svg(true)
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

export class CanvasView extends LayoutDOMView {
  model: Canvas

  bbox: BBox = new BBox()

  webgl?: WebGLState

  underlays_el: HTMLElement
  primary: CanvasLayer
  overlays: CanvasLayer
  overlays_el: HTMLElement
  events_el: HTMLElement

  ui_event_bus: UIEventBus

  initialize(): void {
    super.initialize()

    const {output_backend, hidpi} = this.model
    if (output_backend == "webgl") {
      this.webgl = global_webgl
    }

    this.underlays_el = div({style})
    this.primary = new CanvasLayer(output_backend, hidpi)
    this.overlays = new CanvasLayer(output_backend, hidpi)
    this.overlays_el = div({style})
    this.events_el = div({class: "bk-canvas-events", style})

    this.ui_event_bus = new UIEventBus(this)
    this.throttled_paint = throttle(() => this.repaint(), 1000/60)
  }

  remove(): void {
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

  dirty: boolean = true

  resize(width: number, height: number): void {
    this.bbox = new BBox({left: 0, top: 0, width, height})

    this.primary.resize(width, height)
    this.primary.prepare()
    this.overlays.resize(width, height)
    this.overlays.prepare()
    this.prepare_webgl(width, height)

    this.dirty = true
  }

  prepare_webgl(width: number, height: number): void {
    // Prepare WebGL for a drawing pass
    const {webgl} = this
    if (webgl != null) {
      // Sync canvas size
      webgl.canvas.width = this.pixel_ratio*width
      webgl.canvas.height = this.pixel_ratio*height
      const {gl} = webgl
      // Setup blending
      gl.enable(gl.BLEND)
      gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE_MINUS_DST_ALPHA, gl.ONE) // premultipliedAlpha == true
    }
  }

  clip_webgl(clip_box: Box): void {
    const {webgl} = this
    if (webgl != null) {
      const {gl} = webgl
      gl.enable(gl.SCISSOR_TEST)
      const {x: sx, y: sy, width, height} = clip_box
      const {xview, yview} = this.bbox
      const vx = xview.compute(sx)
      const vy = yview.compute(sy + height)
      const ratio = this.pixel_ratio
      gl.scissor(ratio*vx, ratio*vy, ratio*width, ratio*height) // lower left corner, width, height
    }
  }

  clear_webgl(): void {
    const {webgl} = this
    if (webgl != null) {
      // Prepare GL for drawing
      const {gl, canvas} = webgl
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT || gl.DEPTH_BUFFER_BIT)
    }
  }

  blit_webgl(ctx: Context2d): void {
    // This should be called when the ctx has no state except the HIDPI transform
    const {webgl} = this
    if (webgl != null) {
      // Blit gl canvas into the 2D canvas. To do 1-on-1 blitting, we need
      // to remove the hidpi transform, then blit, then restore.
      // ctx.globalCompositeOperation = "source-over"  -> OK; is the default
      logger.debug('drawing with WebGL')
      ctx.restore()
      ctx.drawImage(webgl.canvas, 0, 0)
      // Set back hidpi transform
      ctx.save()
      if (this.model.hidpi) {
        const ratio = this.pixel_ratio
        ctx.scale(ratio, ratio)
        ctx.translate(0.5, 0.5)
      }
    }
  }

  compose(): CanvasLayer {
    const {output_backend, hidpi} = this.model
    const {width, height} = this.bbox
    const composite = new CanvasLayer(output_backend, hidpi)
    composite.resize(width, height)
    composite.ctx.drawImage(this.primary.canvas, 0, 0)
    composite.ctx.drawImage(this.overlays.canvas, 0, 0)
    return composite
  }

  save(name: string): void {
    this.compose().save(name)
  }

  protected _interactive_state: {renderer: InteractiveRenderer, timestamp: number} | null = null

  interactive_start(renderer: InteractiveRenderer): void {
    const state = this._interactive_state
    const timestamp = Date.now()

    if (state == null) {
      this._interactive_state = {renderer, timestamp}
      renderer.trigger_event(new LODStart())
    } else {
      state.timestamp = timestamp
    }
  }

  interactive_stop(renderer: InteractiveRenderer): void {
    const state = this._interactive_state
    if (state != null && state.renderer == renderer) {
      renderer.trigger_event(new LODEnd())
    }
    this._interactive_state = null
  }

  interactive_duration(): number {
    const state = this._interactive_state
    if (state == null)
      return -1
    else
      return Date.now() - state.timestamp
  }

  plot_views: PlotView[] = []
  /*
  get plot_views(): PlotView[] {
    return [] // XXX
  }
  */

  protected throttled_paint: () => void

  protected _dirty_renderers: Set<PaintableView> = new Set()

  repaint(): void {
    if (this.is_paused)
      return

    /*
    const interactive_duration = this.interactive_duration()
    if (interactive_duration >= 0 && interactive_duration < this.model.lod_interval) {
      setTimeout(() => {
        if (this.interactive_duration() > this.model.lod_timeout) {
          this.interactive_stop(this.model)
        }
        this.request_paint()
      }, this.model.lod_timeout)
    } else
      this.interactive_stop(this.model)
    */

    let do_primary = false
    let do_overlays = false

    if (this.dirty) {
      do_primary = true
      do_overlays = true
    } else {
      for (const painter of this._dirty_renderers) {
        const {level} = painter.model
        if (level != "overlay")
          do_primary = true
        else
          do_overlays = true
        if (do_primary && do_overlays)
          break
      }
    }

    function has_dirty(plot_view: PlotView): boolean {
      for (const r of plot_view.computed_renderers) {
        if (plot_view.renderer_views[r.id].dirty)
          return true
      }
      return false
    }

    const {primary, overlays} = this

    if (do_primary) {
      if (this.dirty)
        primary.clear()

      const {ctx} = primary
      for (const plot_view of this.plot_views) {
        if (!(plot_view.dirty || has_dirty(plot_view)))
          continue
        ctx.save()
        const {x, y, width, height} = plot_view.layout.bbox
        ctx.clearRect(x, y, width, height)
        plot_view.paint()
        this._paint_level(primary, "image", plot_view)
        this._paint_level(primary, "underlay", plot_view)
        this._paint_level(primary, "glyph", plot_view)
        this._paint_level(primary, "guide", plot_view)
        this._paint_level(primary, "annotation", plot_view)
        ctx.restore()
      }
    }

    if (do_overlays) {
      if (this.dirty)
        overlays.clear()

      const {ctx} = overlays
      for (const plot_view of this.plot_views) {
        if (!(plot_view.dirty || has_dirty(plot_view)))
          continue
        ctx.save()
        const {x, y, width, height} = plot_view.layout.bbox
        ctx.clearRect(x, y, width, height)
        this._paint_level(overlays, "overlay", plot_view)
        ctx.restore()
      }
    }

    for (const plot_view of this.plot_views) {
      for (const renderer_view of plot_view.computed_renderers) {
        plot_view.renderer_views[renderer_view.id].dirty = false
      }
      plot_view.dirty = false
    }

    this._dirty_renderers.clear()
    this.dirty = false
  }

  _paint_level(layer: CanvasLayer, level: RenderLevel, plot_view: PlotView): void {
    const {ctx} = layer

    for (const renderer of plot_view.computed_renderers) {
      if (renderer.level != level)
        continue

      const renderer_view = plot_view.renderer_views.get(renderer)!

      if (renderer_view.has_webgl) {
        this.clear_webgl()
      }

      ctx.save()
      const {clip_box} = renderer_view
      if (clip_box != null) {
        ctx.beginPath()
        const {x, y, width, height} = clip_box
        ctx.rect(x, y, width, height)
        ctx.clip()
      }

      renderer_view.paint()
      ctx.restore()

      if (renderer_view.has_webgl) {
        this.blit_webgl(ctx)
        this.clear_webgl()
      }
    }
  }

  request_paint(...to_invalidate: PaintableView[]): void {
    if (to_invalidate.length != 0) {
      for (const renderer_view of to_invalidate) {
        this._dirty_renderers.add(renderer_view)
        renderer_view.dirty = true
      }
    } else {
      this.dirty = true
    }

    if (!this.is_paused) {
      const promise = this.throttled_paint()
      this._ready = this._ready.then(() => promise)
    }
  }

  protected _is_paused?: number
  get is_paused(): boolean {
    return this._is_paused != null && this._is_paused != 0
  }

  pause(): void {
    if (this._is_paused == null)
      this._is_paused = 1
    else
      this._is_paused += 1
  }

  unpause(no_render: boolean = false): void {
    if (this._is_paused == null)
      throw new Error("wasn't paused")

    this._is_paused -= 1
    if (this._is_paused == 0 && !no_render)
      this.request_paint()
  }

  get child_models() {
    return []
  }

  _update_layout(): void {
    this.layout = new LayoutItem()
    this.layout.set_sizing(this.box_sizing())
  }

  render(): void {
    super.render()

    const elements = [
      this.underlays_el,
      this.primary.canvas,
      this.overlays.canvas,
      this.overlays_el,
      this.events_el,
    ]

    extend(this.el.style, style)
    append(this.el, ...elements)
  }

  after_layout(): void {
    super.after_layout()
    const {width, height} = this.layout.bbox
    this.resize(width, height)
  }
}

export namespace Canvas {
  export type Attrs = p.AttrsOf<Props>

  export type Props = LayoutDOM.Props & {
    renderers: p.Property<Renderer[]>
    hidpi: p.Property<boolean>
    output_backend: p.Property<OutputBackend>
  }
}

export interface Canvas extends Canvas.Attrs {}

export class Canvas extends LayoutDOM {
  properties: Canvas.Props
  __view_type__: CanvasView

  constructor(attrs?: Partial<Canvas.Attrs>) {
    super(attrs)
  }

  static init_Canvas(): void {
    this.prototype.default_view = CanvasView

    this.define<Canvas.Props>({
      renderers:      [ p.Array,         []       ],
      hidpi:          [ p.Boolean,       true     ],
      output_backend: [ p.OutputBackend, "canvas" ],
    })
  }
}
