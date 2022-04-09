import {HasProps} from "core/has_props"
import {settings} from "core/settings"
import {DOMView} from "core/dom_view"
import {logger} from "core/logging"
import * as p from "core/properties"
import {div, append} from "core/dom"
import {OutputBackend} from "core/enums"
import {extend} from "core/util/object"
import {UIEventBus} from "core/ui_events"
import {build_views, remove_views} from "core/build_views"
import {BBox} from "core/util/bbox"
import {load_module} from "core/util/modules"
import {parse_css_font_size} from "core/util/text"
import {Context2d, CanvasLayer} from "core/util/canvas"
import {PlotView} from "../plots/plot"
import {Renderer, RenderingTarget} from "../renderers/renderer"
import {Range1d} from "../ranges/range1d"
import {LinearScale} from "../scales/linear_scale"
import {CoordinateSystem} from "./coordinates"
import type {ReglWrapper} from "../glyphs/webgl/regl_wrap"

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
  const gl = canvas.getContext("webgl", {premultipliedAlpha: true})

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
    if (_global_webgl !== undefined)
      return _global_webgl
    else
      return _global_webgl = await init_webgl()
  }
})()

const style = {
  position: "absolute",
  top: "0",
  left: "0",
}

export class CanvasView extends DOMView implements RenderingTarget {
  override model: Canvas
  override el: HTMLElement

  private _bbox = new BBox()
  get bbox(): BBox {
    return this._bbox
  }

  webgl: WebGLState | null = null

  underlays_el: HTMLElement
  primary: CanvasLayer
  overlays: CanvasLayer
  overlays_el: HTMLElement
  events_el: HTMLElement

  ui_event_bus: UIEventBus
  paint_engine: PaintEngine

  readonly screen: CoordinateSystem = (() => {
    const {left, right, top, bottom} = this._bbox

    const x_source = new Range1d({start: left, end: right})
    const y_source = new Range1d({start: top, end: bottom})
    const x_target = new Range1d({start: left, end: right})
    const y_target = new Range1d({start: top, end: bottom})

    return {
      x_scale: new LinearScale({source_range: x_source, target_range: x_target}),
      y_scale: new LinearScale({source_range: y_source, target_range: y_target}),
    }
  })()

  readonly view: CoordinateSystem = (() => {
    const {left, right, top, bottom} = this._bbox

    const x_source = new Range1d({start: left, end: right})
    const y_source = new Range1d({start: top, end: bottom})
    const x_target = new Range1d({start: left, end: right})
    const y_target = new Range1d({start: bottom, end: top})

    return {
      x_scale: new LinearScale({source_range: x_source, target_range: x_target}),
      y_scale: new LinearScale({source_range: y_source, target_range: y_target}),
    }
  })()

  get canvas(): CanvasView {
    return this
  }

  override initialize(): void {
    super.initialize()

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

    this.el.style.position = "relative"
    append(this.el, ...elements)

    this.renderer_views = new Map()

    this.ui_event_bus = new UIEventBus(this)
    this.paint_engine = new PaintEngine(this)
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()

    if (this.model.output_backend == "webgl") {
      this.webgl = await global_webgl()
      if (settings.force_webgl && this.webgl == null)
        throw new Error("webgl is not available")
    }

    await this.build_renderer_views()
  }

  renderer_views: Map<Renderer, RendererView>

  async build_renderer_views(): Promise<void> {
    await build_views(this.renderer_views, this.model.renderers, {parent: this})
  }

  override remove(): void {
    remove_views(this.renderer_views)
    this.paint_engine.destroy()
    this.ui_event_bus.destroy()
    super.remove()
  }

  override render(): void {
    // TODO
  }

  override connect_signals(): void {
    super.connect_signals()
    const {renderers} = this.model.properties
    this.on_change(renderers, async () => {
      await this.build_renderer_views()
    })
  }

  get base_font_size(): number | null {
    const font_size = getComputedStyle(this.el).fontSize
    const result = parse_css_font_size(font_size)

    if (result != null) {
      const {value, unit} = result
      if (unit == "px")
        return value
    }

    return null
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
    if (this._bbox.width == width && this._bbox.height == height)
      return

    this._bbox = new BBox({left: 0, top: 0, width, height})
    const {left, right, top, bottom} = this._bbox

    this.screen.x_scale.source_range.setv({start: left, end: right})
    this.screen.y_scale.source_range.setv({start: top, end: bottom})
    this.screen.x_scale.target_range.setv({start: left, end: right})
    this.screen.y_scale.target_range.setv({start: top, end: bottom})

    this.view.x_scale.source_range.setv({start: left, end: right})
    this.view.y_scale.source_range.setv({start: top, end: bottom})
    this.view.x_scale.target_range.setv({start: left, end: right})
    this.view.y_scale.target_range.setv({start: bottom, end: top})

    const style = {
      width: `${width}px`,
      height: `${height}px`,
    }

    extend(this.el.style, style)
    extend(this.underlays_el.style, style)
    this.primary.resize(width, height)
    this.overlays.resize(width, height)
    extend(this.overlays_el.style, style)
    extend(this.events_el.style, style)

    if (this.plot_views.length == 0) // REMOVE
      this.paint_engine.request_repaint()
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
      const {x_view, y_view} = this.bbox
      const vx = x_view.compute(sx)
      const vy = y_view.compute(sy + h)
      const ratio = this.pixel_ratio
      webgl.regl_wrapper.set_scissor(ratio*vx, ratio*vy, ratio*w, ratio*h)
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

  request_repaint(): void {
    this.paint_engine.request_repaint()
  }

  request_paint(to_invalidate: RendererView | RendererView[]): void {
    this.paint_engine.request_paint(to_invalidate)
  }
}

export namespace Canvas {
  export type Attrs = p.AttrsOf<Props>

  export type Props = HasProps.Props & {
    renderers: p.Property<Renderer[]>
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

  static {
    this.prototype.default_view = CanvasView

    this.internal<Canvas.Props>(({Boolean, Array, Ref}) => ({
      renderers:      [ Array(Ref(Renderer)), [] ],
      hidpi:          [ Boolean, true ],
      output_backend: [ OutputBackend, "canvas" ],
    }))
  }
}

import {RenderLevel} from "core/enums"
import {throttle, ThrottledFn} from "core/util/throttle"
import {assert} from "core/util/assert"
import {RendererView} from "../renderers/renderer"

export class PaintEngine {

  protected _ready: Promise<void> = Promise.resolve(undefined)
  get ready(): Promise<void> {
    return this._ready
  }

  protected throttled_paint: ThrottledFn

  protected _invalidated_painters: Set<RendererView> = new Set()
  protected _invalidate_all: boolean = true

  get renderers(): Renderer[] {
    return this.canvas.model.renderers
  }

  get renderer_views(): Map<Renderer, RendererView> {
    return this.canvas.renderer_views
  }

  constructor(readonly canvas: CanvasView) {
    this.throttled_paint = throttle(() => this.paint(), 1000/60)
  }

  destroy(): void {
    this.throttled_paint.stop()
  }

  protected _is_paused = 0

  get is_paused(): boolean {
    return this._is_paused > 0
  }

  pause(): void {
    this._is_paused += 1
  }

  unpause(): void {
    assert(this._is_paused >= 1)
    this._is_paused -= 1
    if (this._is_paused == 0)
      this.schedule_paint()
  }

  request_repaint(): void {
    this.invalidate_painters("everything")
    this.schedule_paint()
  }

  request_paint(to_invalidate: RendererView | RendererView[]): void {
    this.invalidate_painters(to_invalidate)
    this.schedule_paint()
  }

  invalidate_painters(to_invalidate: RendererView[] | RendererView | "everything"): void {
    if (to_invalidate == "everything")
      this._invalidate_all = true
    else if (to_invalidate instanceof RendererView)
      this._invalidated_painters.add(to_invalidate)
    else {
      for (const renderer_view of to_invalidate)
        this._invalidated_painters.add(renderer_view)
    }
  }

  schedule_paint(): void {
    if (!this.is_paused) {
      const promise = this.throttled_paint()
      this._ready = this._ready.then(() => promise)
    }
  }

  paint(): void {
    let do_primary = false
    let do_overlays = false

    if (this._invalidate_all) {
      do_primary = true
      do_overlays = true
    } else {
      for (const painter of this._invalidated_painters) {
        const {level} = painter.model
        if (level != "overlay")
          do_primary = true
        else
          do_overlays = true
        if (do_primary && do_overlays)
          break
      }
    }

    if (!do_primary && !do_overlays)
      return

    this._invalidated_painters.clear()
    this._invalidate_all = false

    const frame_box: FrameBox = [
      this.canvas.bbox.left,
      this.canvas.bbox.top,
      this.canvas.bbox.width,
      this.canvas.bbox.height,
    ]

    const {primary, overlays} = this.canvas

    if (do_primary) {
      primary.prepare()
      this.canvas.prepare_webgl(frame_box)

      this._paint_levels(primary.ctx, "image", frame_box, true)
      this._paint_levels(primary.ctx, "underlay", frame_box, true)
      this._paint_levels(primary.ctx, "glyph", frame_box, true)
      this._paint_levels(primary.ctx, "guide", frame_box, false)
      this._paint_levels(primary.ctx, "annotation", frame_box, false)
      primary.finish()
    }

    if (do_overlays) {
      overlays.prepare()
      this._paint_levels(overlays.ctx, "overlay", frame_box, false)
      overlays.finish()
    }
  }

  protected _paint_levels(ctx: Context2d, level: RenderLevel, clip_region: FrameBox, global_clip: boolean): void {
    for (const renderer of this.renderers) {
      if (renderer.level != level)
        continue

      const renderer_view = this.renderer_views.get(renderer)!

      ctx.save()
      if (global_clip || renderer_view.needs_clip) {
        ctx.beginPath()
        ctx.rect(...clip_region)
        ctx.clip()
      }

      renderer_view.render()
      ctx.restore()

      if (renderer_view.has_webgl && renderer_view.needs_webgl_blit) {
        this.canvas.blit_webgl(ctx)
      }
    }
  }
}
