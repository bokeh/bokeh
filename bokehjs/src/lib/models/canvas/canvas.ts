import {Model} from "../../model"
import {settings} from "core/settings"
import {ViewOf, SerializableState} from "core/view"
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
import {CanvasLayer} from "core/util/canvas"
import {PlotView} from "../plots/plot"
import {Renderer, RenderingTarget, screen, view} from "../renderers/renderer"
import {CoordinateSystem} from "./coordinates" // TODO: rename this
import {Coordinate, Node, XY} from "../coordinates"
import type {ReglWrapper} from "../glyphs/webgl/regl_wrap"

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

  readonly screen: CoordinateSystem = screen(this.bbox)
  readonly view: CoordinateSystem = view(this.bbox)

  get canvas(): CanvasView {
    return this
  }

  get layers(): CanvasLayer[] {
    return [this.primary, this.overlays]
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
      ...this.layers.map((layer) => layer.el),
      this.overlays_el,
      this.events_el,
    ]

    this.el.style.position = "relative"
    append(this.el, ...elements)

    this._renderer_views = new Map()

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

  protected _renderer_views: Map<Renderer, RendererView>

  async build_renderer_views(): Promise<void> {
    await build_views(this._renderer_views, this.model.renderers, {parent: this})
  }

  get renderer_views(): RendererView[] {
    return this.model.renderers.map((r) => this._renderer_views.get(r)!)
  }

  view_for<T extends Renderer>(model: T): ViewOf<T> {
    const view = this._renderer_views.get(model)
    if (view != null)
      return view
    else
      throw new Error(`${model} doesn't belong to ${this}`)
  }

  override remove(): void {
    remove_views(this._renderer_views)
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

    this.screen.update(this.bbox)
    this.view.update(this.bbox)

    const style = {
      width: `${width}px`,
      height: `${height}px`,
    }

    extend(this.el.style, style)
    extend(this.underlays_el.style, style)
    extend(this.overlays_el.style, style)
    extend(this.events_el.style, style)

    for (const layer of this.layers) {
      layer.resize(width, height)
    }

    if (this.webgl != null) {
      const {canvas} = this.webgl
      canvas.width = this.pixel_ratio*width
      canvas.height = this.pixel_ratio*height
    }

    if (this.plot_views.length == 0) // REMOVE
      this.paint_engine.request_repaint()
  }

  prepare_webgl(clip_box: BBox): void {
    // Prepare WebGL for a drawing pass
    const {webgl} = this
    if (webgl != null) {
      const {x: sx, y: sy, width: vw, height: vh} = clip_box
      const {x_view, y_view} = this.bbox
      const vx = x_view.compute(sx)
      const vy = y_view.compute(sy + vh)

      const {regl_wrapper} = webgl
      const ratio = this.pixel_ratio

      regl_wrapper.set_scissor(ratio*vx, ratio*vy, ratio*vw, ratio*vh)

      const {width: cw, height: ch} = this.bbox
      regl_wrapper.clear(ratio*cw, ratio*ch)
    }
  }

  blit_webgl(layer: CanvasLayer): void {
    const {webgl} = this
    if (webgl != null) {
      // Blit gl canvas into the 2D canvas. To do 1-on-1 blitting, we need
      // to remove the hidpi transform, then blit, then restore.
      // ctx.globalCompositeOperation = "source-over"  -> OK; is the default
      layer.revert_to("init", (ctx) => {
        ctx.drawImage(webgl.canvas, 0, 0)
      })
    }
  }

  compose(): CanvasLayer {
    const composite = this.create_layer()
    const {width, height} = this.bbox
    composite.resize(width, height)
    for (const layer of this.layers) {
      composite.ctx.drawImage(layer.canvas, 0, 0)
    }
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

  override serializable_state(): SerializableState {
    const {children, ...state} = super.serializable_state()
    const renderers = this.renderer_views.map((view) => view.serializable_state())
    return {...state, children: [...children ?? [], ...renderers]}
  }

  resolve(coord: Coordinate): Coordinate {
    if (coord instanceof Node) {
      const target = (() => {
        const {target} = coord
        if (target instanceof Canvas) {
          if (target == this.model)
            return this
          else
            throw new Error("attempted to resolve a canvas node from another canvas")
        } else
          return this.view_for(target)
      })()

      const resolved = target.resolve_node?.(coord)

      if (resolved != null)
        return resolved
      else
        throw new Error(`can't resolve '${coord.term}' node of ${coord.target}`)
    } else
      return coord
  }

  resolve_node(node: Node): Coordinate | null {
    const {left, right, top, bottom} = this.bbox

    switch (node.term) {
      case "cursor": {
        const {sx, sy} = this.ui_event_bus.cursor_position
        return new XY({x: sx, y: sy, x_units: "canvas", y_units: "canvas"})
      }
      case "top_left":
        return new XY({x: left, y: top, x_units: "canvas", y_units: "canvas"})
      case "top_right":
        return new XY({x: right, y: top, x_units: "canvas", y_units: "canvas"})
      case "bottom_left":
        return new XY({x: left, y: bottom, x_units: "canvas", y_units: "canvas"})
      case "bottom_right":
        return new XY({x: right, y: bottom, x_units: "canvas", y_units: "canvas"})
      default:
        return null
    }
  }
}

export namespace Canvas {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    renderers: p.Property<Renderer[]>
    hidpi: p.Property<boolean>
    output_backend: p.Property<OutputBackend>
  }
}

export interface Canvas extends Canvas.Attrs {}

export class Canvas extends Model {
  override properties: Canvas.Props
  override __view_type__: CanvasView

  constructor(attrs?: Partial<Canvas.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = CanvasView

    this.define<Canvas.Props>(({Boolean, Array, Ref}) => ({
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

  get renderers(): RendererView[] {
    return this.canvas.model.renderers.map((r) => this.canvas.view_for(r))
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

    const {primary, overlays} = this.canvas

    if (do_primary) {
      primary.prepare()
      this._paint_levels(primary, "image", true)
      this._paint_levels(primary, "underlay", true)
      this._paint_levels(primary, "glyph", true)
      this._paint_levels(primary, "guide", false)
      this._paint_levels(primary, "annotation", false)
      primary.finish()
    }

    if (do_overlays) {
      overlays.prepare()
      this._paint_levels(overlays, "overlay", false)
      overlays.finish()
    }
  }

  protected _paint_levels(layer: CanvasLayer, level: RenderLevel, global_clip: boolean): void {
    for (const renderer of this.renderers) {
      if (renderer.model.level != level)
        continue

      const {has_webgl, clip_box} = renderer

      if (has_webgl) {
        this.canvas.prepare_webgl(clip_box)
      }

      const {ctx} = layer
      ctx.save()

      if (global_clip || renderer.needs_clip) {
        ctx.beginPath()
        ctx.rect(clip_box)
        ctx.clip()
      }

      renderer.render()
      ctx.restore()

      if (has_webgl) {
        this.canvas.blit_webgl(layer)
      }
    }
  }
}
