import {CartesianFrame} from "../canvas/cartesian_frame"
import {Canvas, CanvasView} from "../canvas/canvas"
import {Range} from "../ranges/range"
import {DataRange1d} from "../ranges/data_range1d"
import {Renderer, RendererView} from "../renderers/renderer"
import {GlyphRenderer, GlyphRendererView} from "../renderers/glyph_renderer"
import {ToolView} from "../tools/tool"
import {Selection} from "../selections/selection"
import {LayoutDOM, LayoutDOMView} from "../layouts/layout_dom"
import {Plot} from "./plot"
import {Annotation, AnnotationView} from "../annotations/annotation"
import {Title} from "../annotations/title"
import {Axis, AxisView} from "../axes/axis"
import {ToolbarPanel} from "../annotations/toolbar_panel"

import {Reset} from "core/bokeh_events"
import {Arrayable} from "core/types"
import {Signal0} from "core/signaling"
import {build_views, remove_views} from "core/build_views"
import {UIEvents} from "core/ui_events"
import {Visuals} from "core/visuals"
import {logger} from "core/logging"
import {Side, RenderLevel} from "core/enums"
import {Rect} from "core/util/spatial"
import {throttle} from "core/util/throttle"
import {isArray, isStrictNaN} from "core/util/types"
import {copy, reversed} from "core/util/array"
import {values} from "core/util/object"
import {Context2d, SVGRenderingContext2D} from "core/util/canvas"
import {BBox, SizeHint, SizingPolicy, Margin, Layoutable} from "core/layout"
import {HStack, VStack, AnchorLayout} from "core/layout/alignments"
import {SidePanel} from "core/layout/side_panel"
import {Row, Column} from "core/layout/grid"

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
  canvas: HTMLCanvasElement
  ctx: WebGLRenderingContext
}

let global_gl: WebGLState | null = null

export type FrameBox = [number, number, number, number]

export type Interval = {start: number, end: number}

export type RangeInfo = {
  xrs: {[key: string]: Interval}
  yrs: {[key: string]: Interval}
}

export type StateInfo = {
  range?: RangeInfo
  selection: {[key: string]: Selection}
  dimensions: {
    width: number
    height: number
  }
}

export class PlotLayout extends Layoutable {

  top_panel = new VStack()
  bottom_panel = new VStack()
  left_panel = new HStack()
  right_panel = new HStack()
  center_panel = new AnchorLayout()

  min_border: Margin = {left: 0, top: 0, right: 0, bottom: 0}

  size_hint(): SizeHint {
    const left_hint = this.left_panel.size_hint()
    const left = Math.max(left_hint.width, this.min_border.left)

    const right_hint = this.right_panel.size_hint()
    const right = Math.max(right_hint.width, this.min_border.right)

    const top_hint = this.top_panel.size_hint()
    const top = Math.max(top_hint.height, this.min_border.top)

    const bottom_hint = this.bottom_panel.size_hint()
    const bottom = Math.max(bottom_hint.height, this.min_border.bottom)

    const center = this.center_panel.size_hint()

    let width: number
    if (this.sizing.width_policy == "fixed")
      width = this.sizing.width!
    else
      width = left + center.width + right // this.sizing.width != null)

    let height: number
    if (this.sizing.height_policy == "fixed")
      height = this.sizing.height!
    else
      height = top + center.height + bottom // this.sizing.height != null)

    return {width, height, inner: {left, right, top, bottom}}
  }

  protected _set_geometry(outer: BBox, inner: BBox): void {
    super._set_geometry(outer, inner)

    this.center_panel.set_geometry(inner)

    const left_hint = this.left_panel.size_hint()
    const right_hint = this.right_panel.size_hint()
    const top_hint = this.top_panel.size_hint()
    const bottom_hint = this.bottom_panel.size_hint()

    const {left, top, right, bottom} = inner

    this.top_panel.set_geometry(new BBox({left, right, bottom: top, height: top_hint.height}))
    this.bottom_panel.set_geometry(new BBox({left, right, top: bottom, height: bottom_hint.height}))
    this.left_panel.set_geometry(new BBox({top, bottom, right: left, width: left_hint.width}))
    this.right_panel.set_geometry(new BBox({top, bottom, left: right, width: right_hint.width}))
  }
}

export namespace PlotView {
  export type Options = LayoutDOMView.Options & {model: Plot}
}

export class PlotView extends LayoutDOMView {
  model: Plot
  visuals: Plot.Visuals

  layout: PlotLayout

  frame: CartesianFrame

  canvas: Canvas
  canvas_view: CanvasView

  protected _title: Title
  protected _toolbar: ToolbarPanel

  protected _size_hint: SizeHint
  protected _outer_box: BBox = new BBox()
  protected _inner_box: BBox = new BBox()
  protected _needs_paint: boolean = true

  gl?: WebGLState

  force_paint: Signal0<this>
  state_changed: Signal0<this>
  visibility_callbacks: Function[]

  protected _is_paused?: number

  protected lod_started: boolean

  protected _initial_state_info: StateInfo

  protected state: {
    history: {type: string, info: StateInfo}[]
    index: number
  }

  protected throttled_paint: () => void
  protected ui_event_bus: UIEvents

  computed_renderers: Renderer[]

  /*protected*/ renderer_views: {[key: string]: RendererView}
  protected tool_views: {[key: string]: ToolView}

  protected range_update_timestamp?: number

  get canvas_overlays(): HTMLElement {
    return this.canvas_view.overlays_el
  }

  get canvas_events(): HTMLElement {
    return this.canvas_view.events_el
  }

  get is_paused(): boolean {
    return this._is_paused != null && this._is_paused !== 0
  }

  get child_models(): LayoutDOM[] {
    return []
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

  // TODO: this needs to be removed
  request_render(): void {
    this.request_paint()
  }

  request_paint(): void {
    if (!this.is_paused)
      this.throttled_paint()
  }

  reset(): void {
    this.clear_state()
    this.reset_range()
    this.reset_selection()
    this.model.trigger_event(new Reset())
  }

  remove(): void {
    this.ui_event_bus.destroy()
    remove_views(this.renderer_views)
    remove_views(this.tool_views)
    this.canvas_view.remove()
    super.remove()
  }

  render(): void {
    super.render()

    this.el.appendChild(this.canvas_view.el)
    this.canvas_view.render()
  }

  initialize(options: PlotView.Options): void {
    this.pause()

    super.initialize(options)

    this.force_paint = new Signal0(this, "force_paint")
    this.state_changed = new Signal0(this, "state_changed")

    this.lod_started = false
    this.visuals = new Visuals(this.model) as any // XXX

    this._initial_state_info = {
      selection: {},                      // XXX: initial selection?
      dimensions: {width: 0, height: 0},  // XXX: initial dimensions
    }
    this.visibility_callbacks = []

    this.state = {history: [], index: -1}

    this.canvas = new Canvas({
      map: this.model.use_map || false,
      use_hidpi: this.model.hidpi,
      output_backend: this.model.output_backend,
    })

    this.frame = new CartesianFrame(
      this.model.x_scale,
      this.model.y_scale,
      this.model.x_range,
      this.model.y_range,
      this.model.extra_x_ranges,
      this.model.extra_y_ranges,
    )

    this.canvas_view = new this.canvas.default_view({model: this.canvas, parent: this}) as CanvasView

    // If requested, try enabling webgl
    if (this.model.output_backend == "webgl")
      this.init_webgl()

    this.throttled_paint = throttle((() => this.force_paint.emit()), 15)  // TODO (bev) configurable

    this.ui_event_bus = new UIEvents(this, this.model.toolbar, this.canvas_view.events_el, this.model)

    const {title_location, title} = this.model
    if (title_location != null && title != null) {
      this._title = title instanceof Title ? title : new Title({text: title})
    }

    const {toolbar_location, toolbar} = this.model
    if (toolbar_location != null && toolbar != null) {
      this._toolbar = new ToolbarPanel({toolbar})
      toolbar.toolbar_location = toolbar_location
    }

    this.renderer_views = {}
    this.tool_views = {}

    this.build_renderer_views()
    this.build_tool_views()

    this.update_dataranges()

    this.unpause(true)
    logger.debug("PlotView initialized")
  }

  protected _width_policy(): SizingPolicy {
    return this.model.frame_width == null ? "fixed" : "min"
  }

  protected _height_policy(): SizingPolicy {
    return this.model.frame_height == null ? "fixed" : "min"
  }

  _update_layout(): void {
    this.layout = new PlotLayout()
    this.layout.set_sizing(this.box_sizing())

    const {frame_width, frame_height} = this.model

    this.layout.center_panel = this.frame
    this.layout.center_panel.set_sizing({
      ...(frame_width  != null ? {width_policy:  "fixed", width:  frame_width } : {width_policy:  "max"}),
      ...(frame_height != null ? {height_policy: "fixed", height: frame_height} : {height_policy: "max"}),
    })

    type Panels = (Axis | Annotation | Annotation[])[]

    const above: Panels = copy(this.model.above)
    const below: Panels = copy(this.model.below)
    const left:  Panels = copy(this.model.left)
    const right: Panels = copy(this.model.right)

    const get_side = (side: Side): Panels => {
      switch (side) {
        case "above": return above
        case "below": return below
        case "left":  return left
        case "right": return right
      }
    }

    const {title_location, title} = this.model
    if (title_location != null && title != null) {
      get_side(title_location).push(this._title)
    }

    const {toolbar_location, toolbar} = this.model
    if (toolbar_location != null && toolbar != null) {
      const panels = get_side(toolbar_location)
      let push_toolbar = true

      if (this.model.toolbar_sticky) {
        for (let i = 0; i < panels.length; i++) {
          const panel = panels[i]
          if (panel instanceof Title) {
            panels[i] = [panel, this._toolbar]
            push_toolbar = false
            break
          }
        }
      }

      if (push_toolbar)
        panels.push(this._toolbar)
    }

    const set_layout = (side: Side, model: Annotation | Axis): Layoutable => {
      const view = this.renderer_views[model.id] as AnnotationView | AxisView
      return view.layout = new SidePanel(side, view)
    }

    const set_layouts = (side: Side, panels: Panels) => {
      const layouts: Layoutable[] = []
      for (const panel of panels) {
        if (isArray(panel)) {
          const items = panel.map((subpanel) => set_layout(side, subpanel))

          let layout: Row | Column
          switch (title_location) {
            case "above":
            case "below":
              layout = new Row(items)
              layout.set_sizing({width_policy: "max", height_policy: "min"})
              layout.cols = {1: "min"} // assuming toolbar is last
              break
            case "left":
            case "right": {
              layout = new Column(items)
              layout.set_sizing({width_policy: "min", height_policy: "max"})
              layout.rows = {0: "min"} // assuming toolbar is first
              break
            }
            default:
              throw new Error("unreachable")
          }

          layout.absolute = true
          layouts.push(layout)
        } else
          layouts.push(set_layout(side, panel))
      }

      return layouts
    }

    const min_border = this.model.min_border != null ? this.model.min_border : 0
    this.layout.min_border = {
      left:   this.model.min_border_left   != null ? this.model.min_border_left   : min_border,
      top:    this.model.min_border_top    != null ? this.model.min_border_top    : min_border,
      right:  this.model.min_border_right  != null ? this.model.min_border_right  : min_border,
      bottom: this.model.min_border_bottom != null ? this.model.min_border_bottom : min_border,
    }

    this.layout.top_panel.children    = reversed(set_layouts("above", above))
    this.layout.bottom_panel.children =          set_layouts("below", below)
    this.layout.left_panel.children   = reversed(set_layouts("left",  left))
    this.layout.right_panel.children  =          set_layouts("right", right)
    // this.layout.center_panel.children = TODO
  }

  get axis_views(): AxisView[] {
    const views = []
    for (const id in this.renderer_views) {
      const child_view = this.renderer_views[id]
      if (child_view instanceof AxisView)
        views.push(child_view)
    }
    return views
  }

  set_cursor(cursor: string = "default"): void {
    this.canvas_view.el.style.cursor = cursor
  }

  set_toolbar_visibility(visible: boolean = true): void {
    this.visibility_callbacks.forEach((value) => value(visible))
  }

  init_webgl(): void {
    // We use a global invisible canvas and gl context. By having a global context,
    // we avoid the limitation of max 16 contexts that most browsers have.
    if (global_gl == null) {
      const canvas = document.createElement('canvas')

      const opts: WebGLContextAttributes = {premultipliedAlpha: true}
      const ctx = canvas.getContext("webgl", opts) || canvas.getContext("experimental-webgl", opts)

      // If WebGL is available, we store a reference to the gl canvas on
      // the ctx object, because that's what gets passed everywhere.
      if (ctx != null)
        global_gl = {canvas, ctx}
    }

    if (global_gl != null)
      this.gl = global_gl
    else
      logger.warn('WebGL is not supported, falling back to 2D canvas.')
  }

  prepare_webgl(ratio: number, frame_box: FrameBox): void {
    // Prepare WebGL for a drawing pass
    if (this.gl != null) {
      const canvas = this.canvas_view.get_canvas_element() as HTMLCanvasElement
      // Sync canvas size
      this.gl.canvas.width = canvas.width
      this.gl.canvas.height = canvas.height
      // Prepare GL for drawing
      const {ctx: gl} = this.gl
      gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT || gl.DEPTH_BUFFER_BIT)
      // Clipping
      gl.enable(gl.SCISSOR_TEST)
      const [sx, sy, w, h] = frame_box
      const {xview, yview} = this.canvas_view.bbox
      const vx = xview.compute(sx)
      const vy = yview.compute(sy + h)
      gl.scissor(ratio*vx, ratio*vy, ratio*w, ratio*h) // lower left corner, width, height
      // Setup blending
      gl.enable(gl.BLEND)
      gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE_MINUS_DST_ALPHA, gl.ONE)   // premultipliedAlpha == true
    }
  }
      //gl.blendFuncSeparate(gl.ONE_MINUS_DST_ALPHA, gl.DST_ALPHA, gl.ONE_MINUS_DST_ALPHA, gl.ONE)  # Without premultipliedAlpha == false

  blit_webgl(ratio: number): void {
    // This should be called when the ctx has no state except the HIDPI transform
    const {ctx} = this.canvas_view
    if (this.gl != null) {
      // Blit gl canvas into the 2D canvas. To do 1-on-1 blitting, we need
      // to remove the hidpi transform, then blit, then restore.
      // ctx.globalCompositeOperation = "source-over"  -> OK; is the default
      logger.debug('drawing with WebGL')
      ctx.restore()
      ctx.drawImage(this.gl.canvas, 0, 0)
      // Set back hidpi transform
      ctx.save()
      ctx.scale(ratio, ratio)
      ctx.translate(0.5, 0.5)
    }
  }

  update_dataranges(): void {
    // Update any DataRange1ds here
    const bounds: {[key: string]: Rect} = {}
    const log_bounds: {[key: string]: Rect} = {}

    let calculate_log_bounds = false
    for (const r of values(this.frame.x_ranges).concat(values(this.frame.y_ranges))) {
      if (r instanceof DataRange1d) {
        if (r.scale_hint == "log")
          calculate_log_bounds = true
      }
    }

    for (const id in this.renderer_views) {
      const view = this.renderer_views[id]
      if (view instanceof GlyphRendererView) {
        const bds = view.glyph.bounds()
        if (bds != null)
          bounds[id] = bds

        if (calculate_log_bounds) {
          const log_bds = view.glyph.log_bounds()
          if (log_bds != null)
            log_bounds[id] = log_bds
        }
      }
    }

    let follow_enabled = false
    let has_bounds = false

    const {width, height} = this.frame.bbox
    let r: number | undefined
    if (this.model.match_aspect !== false && width != 0 && height != 0)
      r = (1/this.model.aspect_scale)*(width/height)

    for (const xr of values(this.frame.x_ranges)) {
      if (xr instanceof DataRange1d) {
        const bounds_to_use = xr.scale_hint == "log" ? log_bounds : bounds
        xr.update(bounds_to_use, 0, this.model.id, r)
        if (xr.follow) {
          follow_enabled = true
        }
      }
      if (xr.bounds != null)
        has_bounds = true
    }

    for (const yr of values(this.frame.y_ranges)) {
      if (yr instanceof DataRange1d) {
        const bounds_to_use = yr.scale_hint == "log" ? log_bounds : bounds
        yr.update(bounds_to_use, 1, this.model.id, r)
        if (yr.follow) {
          follow_enabled = true
        }
      }
      if (yr.bounds != null)
        has_bounds = true
    }

    if (follow_enabled && has_bounds) {
      logger.warn('Follow enabled so bounds are unset.')
      for (const xr of values(this.frame.x_ranges)) {
        xr.bounds = null
      }
      for (const yr of values(this.frame.y_ranges)) {
        yr.bounds = null
      }
    }

    this.range_update_timestamp = Date.now()
  }

  map_to_screen(x: Arrayable<number>, y: Arrayable<number>,
                x_name: string = "default", y_name: string = "default"): [Arrayable<number>, Arrayable<number>] {
    return this.frame.map_to_screen(x, y, x_name, y_name)
  }

  push_state(type: string, new_info: Partial<StateInfo>): void {
    const {history, index} = this.state

    const prev_info = history[index] != null ? history[index].info : {}
    const info = {...this._initial_state_info, ...prev_info, ...new_info}

    this.state.history = this.state.history.slice(0, this.state.index + 1)
    this.state.history.push({type, info})
    this.state.index = this.state.history.length - 1

    this.state_changed.emit()
  }

  clear_state(): void {
    this.state = {history: [], index: -1}
    this.state_changed.emit()
  }

  can_undo(): boolean {
    return this.state.index >= 0
  }

  can_redo(): boolean {
    return this.state.index < this.state.history.length - 1
  }

  undo(): void {
    if (this.can_undo()) {
      this.state.index -= 1
      this._do_state_change(this.state.index)
      this.state_changed.emit()
    }
  }

  redo(): void {
    if (this.can_redo()) {
      this.state.index += 1
      this._do_state_change(this.state.index)
      this.state_changed.emit()
    }
  }

  protected _do_state_change(index: number): void {
    const info = this.state.history[index] != null ? this.state.history[index].info : this._initial_state_info

    if (info.range != null)
      this.update_range(info.range)

    if (info.selection != null)
      this.update_selection(info.selection)
  }

  get_selection(): {[key: string]: Selection} {
    const selection: {[key: string]: Selection} = {}
    for (const renderer of this.model.renderers) {
      if (renderer instanceof GlyphRenderer) {
        const {selected} = renderer.data_source
        selection[renderer.id] = selected
      }
    }
    return selection
  }

  update_selection(selection: {[key: string]: Selection} | null): void {
    for (const renderer of this.model.renderers) {
      if (!(renderer instanceof GlyphRenderer))
        continue

      const ds = renderer.data_source
      if (selection != null) {
        if (selection[renderer.id] != null)
          ds.selected.update(selection[renderer.id], true, false)
      } else
        ds.selection_manager.clear()
    }
  }

  reset_selection(): void {
    this.update_selection(null)
  }

  protected _update_ranges_together(range_info_iter: [Range, Interval][]): void {
    // Get weight needed to scale the diff of the range to honor interval limits
    let weight = 1.0
    for (const [rng, range_info] of range_info_iter) {
      weight = Math.min(weight, this._get_weight_to_constrain_interval(rng, range_info))
    }
    // Apply shared weight to all ranges
    if (weight < 1) {
      for (const [rng, range_info] of range_info_iter) {
        range_info.start = weight*range_info.start + (1 - weight)*rng.start
        range_info.end = weight*range_info.end + (1 - weight)*rng.end
      }
    }
  }

  protected _update_ranges_individually(range_info_iter: [Range, Interval][],
                                        is_panning: boolean, is_scrolling: boolean, maintain_focus: boolean): void {
    let hit_bound = false
    for (const [rng, range_info] of range_info_iter) {

      // Limit range interval first. Note that for scroll events,
      // the interval has already been limited for all ranges simultaneously
      if (!is_scrolling) {
        const weight = this._get_weight_to_constrain_interval(rng, range_info)
        if (weight < 1) {
          range_info.start = weight*range_info.start + (1 - weight)*rng.start
          range_info.end = weight*range_info.end + (1 - weight)*rng.end
        }
      }

      // Prevent range from going outside limits
      // Also ensure that range keeps the same delta when panning/scrolling
      if (rng.bounds != null && rng.bounds != "auto") { // check `auto` for type-checking purpose
        const [min, max] = rng.bounds
        const new_interval = Math.abs(range_info.end - range_info.start)

        if (rng.is_reversed) {
          if (min != null) {
            if (min >= range_info.end) {
              hit_bound = true
              range_info.end = min
              if (is_panning || is_scrolling) {
                range_info.start = min + new_interval
              }
            }
          }
          if (max != null) {
            if (max <= range_info.start) {
              hit_bound = true
              range_info.start = max
              if (is_panning || is_scrolling) {
                range_info.end = max - new_interval
              }
            }
          }
        } else {
          if (min != null) {
            if (min >= range_info.start) {
              hit_bound = true
              range_info.start = min
              if (is_panning || is_scrolling) {
                range_info.end = min + new_interval
              }
            }
          }
          if (max != null) {
            if (max <= range_info.end) {
              hit_bound = true
              range_info.end = max
              if (is_panning || is_scrolling) {
                range_info.start = max - new_interval
              }
            }
          }
        }
      }
    }

    // Cancel the event when hitting a bound while scrolling. This ensures that
    // the scroll-zoom tool maintains its focus position. Setting `maintain_focus`
    // to false results in a more "gliding" behavior, allowing one to
    // zoom out more smoothly, at the cost of losing the focus position.
    if (is_scrolling && hit_bound && maintain_focus)
      return

    for (const [rng, range_info] of range_info_iter) {
      rng.have_updated_interactively = true
      if (rng.start != range_info.start || rng.end != range_info.end)
        rng.setv(range_info)
    }
  }

  protected _get_weight_to_constrain_interval(rng: Range, range_info: Interval): number {
    // Get the weight by which a range-update can be applied
    // to still honor the interval limits (including the implicit
    // max interval imposed by the bounds)
    const {min_interval} = rng
    let {max_interval} = rng

    // Express bounds as a max_interval. By doing this, the application of
    // bounds and interval limits can be applied independent from each-other.
    if (rng.bounds != null && rng.bounds != "auto") { // check `auto` for type-checking purpose
      const [min, max] = rng.bounds
      if (min != null && max != null) {
        const max_interval2 = Math.abs(max - min)
        max_interval = max_interval != null ? Math.min(max_interval, max_interval2) : max_interval2
      }
    }

    let weight = 1.0
    if (min_interval != null || max_interval != null) {
      const old_interval = Math.abs(rng.end - rng.start)
      const new_interval = Math.abs(range_info.end - range_info.start)
      if (min_interval > 0 && new_interval < min_interval) {
        weight = (old_interval - min_interval) / (old_interval - new_interval)
      }
      if (max_interval > 0 && new_interval > max_interval) {
        weight = (max_interval - old_interval) / (new_interval - old_interval)
      }
      weight = Math.max(0.0, Math.min(1.0, weight))
    }
    return weight
  }

  update_range(range_info: RangeInfo | null,
               is_panning: boolean = false, is_scrolling: boolean = false, maintain_focus: boolean = true): void {
    this.pause()
    const {x_ranges, y_ranges} = this.frame
    if (range_info == null) {
      for (const name in x_ranges) {
        const rng = x_ranges[name]
        rng.reset()
      }
      for (const name in y_ranges) {
        const rng = y_ranges[name]
        rng.reset()
      }
      this.update_dataranges()
    } else {
      const range_info_iter: [Range, Interval][] = []
      for (const name in x_ranges) {
        const rng = x_ranges[name]
        range_info_iter.push([rng, range_info.xrs[name]])
      }
      for (const name in y_ranges) {
        const rng = y_ranges[name]
        range_info_iter.push([rng, range_info.yrs[name]])
      }
      if (is_scrolling) {
        this._update_ranges_together(range_info_iter)   // apply interval bounds while keeping aspect
      }
      this._update_ranges_individually(range_info_iter, is_panning, is_scrolling, maintain_focus)
    }
    this.unpause()
  }

  reset_range(): void {
    this.update_range(null)
  }

  build_renderer_views(): void {
    this.computed_renderers = []

    this.computed_renderers.push(...this.model.above)
    this.computed_renderers.push(...this.model.below)
    this.computed_renderers.push(...this.model.left)
    this.computed_renderers.push(...this.model.right)
    this.computed_renderers.push(...this.model.center)
    this.computed_renderers.push(...this.model.renderers)

    if (this._title != null)
      this.computed_renderers.push(this._title)

    if (this._toolbar != null)
      this.computed_renderers.push(this._toolbar)

    for (const tool of this.model.toolbar.tools) {
      if (tool.overlay != null)
        this.computed_renderers.push(tool.overlay)

      this.computed_renderers.push(...tool.synthetic_renderers)
    }

    build_views(this.renderer_views, this.computed_renderers, {parent: this})
  }

  get_renderer_views(): RendererView[] {
    return this.computed_renderers.map((r) => this.renderer_views[r.id])
  }

  build_tool_views(): void {
    const tool_models = this.model.toolbar.tools
    const new_tool_views = build_views(this.tool_views, tool_models, {parent: this}) as ToolView[]
    new_tool_views.map((tool_view) => this.ui_event_bus.register_tool(tool_view))
  }

  connect_signals(): void {
    super.connect_signals()

    this.connect(this.force_paint, () => this.repaint())

    const {x_ranges, y_ranges} = this.frame

    for (const name in x_ranges) {
      const rng = x_ranges[name]
      this.connect(rng.change, () => this.request_paint())
    }
    for (const name in y_ranges) {
      const rng = y_ranges[name]
      this.connect(rng.change, () => this.request_paint())
    }

    this.connect(this.model.properties.renderers.change, () => this.build_renderer_views())
    this.connect(this.model.toolbar.properties.tools.change, () => { this.build_renderer_views(); this.build_tool_views() })
    this.connect(this.model.change, () => this.request_paint())
    this.connect(this.model.reset, () => this.reset())
  }

  set_initial_range(): void {
    // check for good values for ranges before setting initial range
    let good_vals = true
    const {x_ranges, y_ranges} = this.frame
    const xrs: {[key: string]: Interval} = {}
    const yrs: {[key: string]: Interval} = {}
    for (const name in x_ranges) {
      const {start, end} = x_ranges[name]
      if (start == null || end == null || isStrictNaN(start + end)) {
        good_vals = false
        break
      }
      xrs[name] = {start, end}
    }
    if (good_vals) {
      for (const name in y_ranges) {
        const {start, end} = y_ranges[name]
        if (start == null || end == null || isStrictNaN(start + end)) {
          good_vals = false
          break
        }
        yrs[name] = {start, end}
      }
    }
    if (good_vals) {
      this._initial_state_info.range = {xrs, yrs}
      logger.debug("initial ranges set")
    } else
      logger.warn('could not set initial ranges')
  }

  has_finished(): boolean {
    if (!super.has_finished())
      return false

    for (const id in this.renderer_views) {
      const view = this.renderer_views[id]
      if (!view.has_finished())
        return false
    }

    return true
  }

  after_layout(): void {
    super.after_layout()

    this._size_hint = this.layout.size_hint()

    this.model.setv({
      inner_width: Math.round(this.frame._width.value),
      inner_height: Math.round(this.frame._height.value),
      outer_width: Math.round(this.layout._width.value),
      outer_height: Math.round(this.layout._height.value),
    }, {no_change: true})

    if (this.model.match_aspect !== false) {
      this.pause()
      this.update_dataranges()
      this.unpause(true)
    }

    const width = this.layout._width.value
    const height = this.layout._height.value

    if (this._outer_box.width != width || this._outer_box.height != height) {
      this.canvas_view.prepare_canvas(width, height)
      this._outer_box = this.layout.bbox
      this._needs_paint = true
    }

    if (!this._inner_box.equals(this.frame.bbox)) {
      this._inner_box = this.frame.bbox
      this._needs_paint = true
    }

    if (this._needs_paint) {
      // XXX: can't be this.request_paint(), because it would trigger back-and-forth
      // layout recomputing feedback loop between plots. Plots are also much more
      // responsive this way, especially in interactive mode.
      this._needs_paint = false
      this.paint()
    }
  }

  protected _needs_layout(): boolean {
    const size_hint = this.layout.size_hint()
    const {_size_hint} = this

    if (_size_hint.width != size_hint.width || _size_hint.height != size_hint.height)
      return true

    if ((_size_hint.inner != null) != (size_hint.inner != null))
      return true

    if (_size_hint.inner != null && size_hint.inner != null) {
      if (_size_hint.inner.left   != size_hint.inner.left  ||
          _size_hint.inner.right  != size_hint.inner.right ||
          _size_hint.inner.top    != size_hint.inner.top   ||
          _size_hint.inner.bottom != size_hint.inner.bottom)
        return true
    }

    return false
  }

  repaint(): void {
    if (this._needs_layout()) {
      this._needs_paint = true
      this.root.compute_layout()
    } else
      this.paint()
  }

  paint(): void {
    if (this.is_paused)
      return

    logger.trace(`PlotView.paint() for ${this.model.id}`)

    const {document} = this.model
    if (document != null) {
      const interactive_duration = document.interactive_duration()
      if (interactive_duration >= 0 && interactive_duration < this.model.lod_interval) {
        setTimeout(() => {
          if (document.interactive_duration() > this.model.lod_timeout) {
            document.interactive_stop(this.model)
          }
          this.request_paint()
        }, this.model.lod_timeout)
      } else
        document.interactive_stop(this.model)
    }

    for (const id in this.renderer_views) {
      const v = this.renderer_views[id]
      if (this.range_update_timestamp == null ||
          (v instanceof GlyphRendererView && v.set_data_timestamp > this.range_update_timestamp)) {
        this.update_dataranges()
        break
      }
    }

    const {ctx} = this.canvas_view
    const ratio = this.canvas.pixel_ratio

    // Set hidpi-transform
    ctx.save()   // Save default state, do *after* getting ratio, cause setting canvas.width resets transforms
    ctx.scale(ratio, ratio)
    ctx.translate(0.5, 0.5)

    const frame_box: FrameBox = [
      this.frame._left.value,
      this.frame._top.value,
      this.frame._width.value,
      this.frame._height.value,
    ]

    this._map_hook(ctx, frame_box)
    this._paint_empty(ctx, frame_box)

    this.prepare_webgl(ratio, frame_box)

    ctx.save()
    if (this.visuals.outline_line.doit) {
      this.visuals.outline_line.set_value(ctx)
      let [x0, y0, w, h] = frame_box
      // XXX: shrink outline region by 1px to make right and bottom lines visible
      // if they are on the edge of the canvas.
      if (x0 + w == this.layout._width.value) {
        w -= 1
      }
      if (y0 + h == this.layout._height.value) {
        h -= 1
      }
      ctx.strokeRect(x0, y0, w, h)
    }
    ctx.restore()

    this._paint_levels(ctx, ['image', 'underlay', 'glyph'], frame_box, true)
    this.blit_webgl(ratio)
    this._paint_levels(ctx, ['annotation'], frame_box, false)
    this._paint_levels(ctx, ['overlay'], frame_box, false)

    if (this._initial_state_info.range == null)
      this.set_initial_range()

    ctx.restore()   // Restore to default state
  }

  protected _paint_levels(ctx: Context2d, levels: RenderLevel[], clip_region: FrameBox, global_clip: boolean): void {
    ctx.save()

    if (global_clip) {
      ctx.beginPath()
      ctx.rect.apply(ctx, clip_region)
      ctx.clip()
    }

    for (const level of levels) {
      for (const renderer of this.computed_renderers) {
        if (renderer.level != level)
          continue

        const renderer_view = this.renderer_views[renderer.id]

        if (!global_clip && renderer_view.needs_clip) {
          ctx.save()
          ctx.beginPath()
          ctx.rect.apply(ctx, clip_region)
          ctx.clip()
        }

        renderer_view.render()

        if (!global_clip && renderer_view.needs_clip) {
          ctx.restore()
        }
      }
    }

    ctx.restore()
  }

  protected _map_hook(_ctx: Context2d, _frame_box: FrameBox): void {}

  protected _paint_empty(ctx: Context2d, frame_box: FrameBox): void {
    const [cx, cy, cw, ch] = [0, 0, this.layout._width.value, this.layout._height.value]
    const [fx, fy, fw, fh] = frame_box

    ctx.clearRect(cx, cy, cw, ch)

    if (this.visuals.border_fill.doit) {
      this.visuals.border_fill.set_value(ctx)
      ctx.fillRect(cx, cy, cw, ch)
      ctx.clearRect(fx, fy, fw, fh)
    }

    if (this.visuals.background_fill.doit) {
      this.visuals.background_fill.set_value(ctx)
      ctx.fillRect(fx, fy, fw, fh)
    }
  }

  save(name: string): void {
    switch (this.model.output_backend) {
      case "canvas":
      case "webgl": {
        const canvas = this.canvas_view.get_canvas_element() as HTMLCanvasElement
        if (canvas.msToBlob != null) {
          const blob = canvas.msToBlob()
          window.navigator.msSaveBlob(blob, name)
        } else {
          const link = document.createElement('a')
          link.href = canvas.toDataURL('image/png')
          link.download = name + ".png"
          link.target = "_blank"
          link.dispatchEvent(new MouseEvent('click'))
        }
        break
      }
      case "svg": {
        const ctx = this.canvas_view._ctx as SVGRenderingContext2D
        const svg = ctx.getSerializedSvg(true)
        const svgblob = new Blob([svg], {type:'text/plain'})
        const downloadLink = document.createElement("a")
        downloadLink.download = name + ".svg"
        downloadLink.innerHTML = "Download svg"
        downloadLink.href = window.URL.createObjectURL(svgblob)
        downloadLink.onclick = (event) => document.body.removeChild(event.target as HTMLElement)
        downloadLink.style.display = "none"
        document.body.appendChild(downloadLink)
        downloadLink.click()
        break
      }
    }
  }
}
