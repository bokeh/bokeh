import {CartesianFrame} from "../canvas/cartesian_frame"
import type {CanvasView, FrameBox} from "../canvas/canvas"
import {Canvas} from "../canvas/canvas"
import type {Renderer} from "../renderers/renderer"
import {RendererView} from "../renderers/renderer"
import type {DataRenderer} from "../renderers/data_renderer"
import type {Tool} from "../tools/tool"
import {ToolProxy} from "../tools/tool_proxy"
import type {Selection} from "../selections/selection"
import type {LayoutDOM, DOMBoxSizing, FullDisplay} from "../layouts/layout_dom"
import {LayoutDOMView} from "../layouts/layout_dom"
import type {Plot} from "./plot"
import {Annotation, AnnotationView} from "../annotations/annotation"
import {Title} from "../annotations/title"
import type {Axis} from "../axes/axis"
import {AxisView} from "../axes/axis"
import type {ToolbarPanelView} from "../annotations/toolbar_panel"
import {ToolbarPanel} from "../annotations/toolbar_panel"
import type {AutoRanged} from "../ranges/data_range1d"
import {is_auto_ranged} from "../ranges/data_range1d"

import {Reset} from "core/bokeh_events"
import type {ViewStorage, IterViews} from "core/build_views"
import {build_view, build_views, remove_views} from "core/build_views"
import type {Renderable} from "core/visuals"
import {Visuals} from "core/visuals"
import {logger} from "core/logging"
import {RangesUpdate} from "core/bokeh_events"
import type {Side, RenderLevel} from "core/enums"
import type {SerializableState} from "core/view"
import {Signal0} from "core/signaling"
import {throttle} from "core/util/throttle"
import {isBoolean, isArray} from "core/util/types"
import {copy, reversed} from "core/util/array"
import {flat_map} from "core/util/iterator"
import type {Context2d} from "core/util/canvas"
import {CanvasLayer} from "core/util/canvas"
import type {Layoutable} from "core/layout"
import {HStack, VStack, NodeLayout} from "core/layout/alignments"
import {BorderLayout} from "core/layout/border"
import {Row, Column} from "core/layout/grid"
import {Panel} from "core/layout/side_panel"
import {BBox} from "core/util/bbox"
import {parse_css_font_size} from "core/util/text"
import type {RangeInfo, RangeOptions} from "./range_manager"
import {RangeManager} from "./range_manager"
import type {StateInfo} from "./state_manager"
import {StateManager} from "./state_manager"
import {settings} from "core/settings"
import type {StyleSheetLike} from "core/dom"
import {InlineStyleSheet, px} from "core/dom"

import plots_css from "styles/plots.css"

const {max} = Math

export class PlotView extends LayoutDOMView implements Renderable {
  declare model: Plot
  visuals: Plot.Visuals

  declare layout: BorderLayout

  frame: CartesianFrame

  canvas_view: CanvasView
  get canvas(): CanvasView {
    return this.canvas_view
  }

  readonly repainted = new Signal0(this, "repainted")

  protected _computed_style = new InlineStyleSheet()

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), plots_css, this._computed_style]
  }

  protected _title?: Title
  protected _toolbar?: ToolbarPanel

  get toolbar_panel(): ToolbarPanelView | undefined {
    return this._toolbar != null ? this.renderer_view(this._toolbar) : undefined
  }

  protected _outer_bbox: BBox = new BBox()
  protected _inner_bbox: BBox = new BBox()
  protected _needs_paint: boolean = true
  protected _invalidated_painters: Set<RendererView> = new Set()
  protected _invalidate_all: boolean = true

  protected _state_manager: StateManager
  protected _range_manager: RangeManager

  get state(): StateManager {
    return this._state_manager
  }

  set invalidate_dataranges(value: boolean) {
    this._range_manager.invalidate_dataranges = value
  }

  protected _is_paused?: number

  protected lod_started: boolean

  protected _initial_state: StateInfo

  protected throttled_paint: () => void

  computed_renderers: Renderer[]

  get computed_renderer_views(): RendererView[] {
    return this.computed_renderers.map((r) => this.renderer_views.get(r)!)
  }

  renderer_view<T extends Renderer>(renderer: T): T["__view_type__"] | undefined {
    const view = this.renderer_views.get(renderer)
    if (view == null) {
      for (const [, renderer_view] of this.renderer_views) {
        const view = renderer_view.renderer_view(renderer)
        if (view != null)
          return view
      }
    }
    return view
  }

  get auto_ranged_renderers(): (RendererView & AutoRanged)[] {
    return this.model.renderers.map((r) => this.renderer_view(r)!).filter(is_auto_ranged)
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

  /*protected*/ readonly renderer_views: ViewStorage<Renderer> = new Map()
  /*protected*/ readonly tool_views: ViewStorage<Tool> = new Map()

  override *children(): IterViews {
    yield* super.children()
    yield* this.renderer_views.values()
    yield* this.tool_views.values()
    yield this.canvas
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

    this._is_paused = Math.max(this._is_paused - 1, 0)
    if (this._is_paused == 0 && !no_render)
      this.request_paint("everything")
  }

  private _needs_notify: boolean = false
  notify_finished_after_paint(): void {
    this._needs_notify = true
  }

  // TODO: this needs to be removed
  request_render(): void {
    this.request_paint("everything")
  }

  request_paint(to_invalidate: (Renderer | RendererView)[] | Renderer | RendererView | "everything"): void {
    this.invalidate_painters(to_invalidate)
    this.schedule_paint()
  }

  invalidate_painters(to_invalidate: (Renderer | RendererView)[] | Renderer | RendererView | "everything"): void {
    if (to_invalidate == "everything")
      this._invalidate_all = true
    else if (isArray(to_invalidate)) {
      for (const item of to_invalidate) {
        const view = (() => {
          if (item instanceof RendererView) {
            return item
          } else {
            return this.renderer_view(item)!
          }
        })()
        this._invalidated_painters.add(view)
      }
    } else {
      const view = (() => {
        if (to_invalidate instanceof RendererView) {
          return to_invalidate
        } else {
          return this.renderer_view(to_invalidate)!
        }
      })()
      this._invalidated_painters.add(view)
    }
  }

  schedule_paint(): void {
    if (!this.is_paused) {
      const promise = this.throttled_paint()
      this._ready = this._ready.then(() => promise)
    }
  }

  request_layout(): void {
    this.request_paint("everything")
  }

  reset(): void {
    if (this.model.reset_policy == "standard") {
      this.state.clear()
      this.reset_range()
      this.reset_selection()
    }
    this.model.trigger_event(new Reset())
  }

  override remove(): void {
    for (const r of this.frame.ranges.values()) {
      r.plots.delete(this)
    }

    remove_views(this.renderer_views)
    remove_views(this.tool_views)

    this.canvas_view.remove()
    super.remove()
  }

  override render(): void {
    super.render()

    this.shadow_el.appendChild(this.canvas_view.el)
    this.canvas_view.render()
  }

  override initialize(): void {
    this.pause()

    super.initialize()

    this.lod_started = false
    this.visuals = new Visuals(this) as Plot.Visuals

    this._initial_state = {
      selection: new Map(),               // XXX: initial selection?
    }

    this.frame = new CartesianFrame(
      this.model.x_scale,
      this.model.y_scale,
      this.model.x_range,
      this.model.y_range,
      this.model.extra_x_ranges,
      this.model.extra_y_ranges,
      this.model.extra_x_scales,
      this.model.extra_y_scales,
    )

    for (const r of this.frame.ranges.values()) {
      r.plots.add(this)
    }

    this._range_manager = new RangeManager(this)
    this._state_manager = new StateManager(this, this._initial_state)

    this.throttled_paint = throttle(() => {
      if (!this._removed) this.repaint()
    }, 1000/60)

    const {title_location, title} = this.model
    if (title_location != null && title != null) {
      this._title = title instanceof Title ? title : new Title({text: title})
    }

    const {toolbar_location, toolbar_inner, toolbar} = this.model
    if (toolbar_location != null) {
      this._toolbar = new ToolbarPanel({toolbar})
      toolbar.location = toolbar_location
      toolbar.inner = toolbar_inner
    }
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()

    const {hidpi, output_backend} = this.model
    const canvas = new Canvas({hidpi, output_backend})
    this.canvas_view = await build_view(canvas, {parent: this})
    this.canvas_view.plot_views = [this]

    await this.build_tool_views()
    await this.build_renderer_views()

    this._range_manager.update_dataranges()
  }

  override box_sizing(): DOMBoxSizing {
    const {width_policy, height_policy, ...sizing} = super.box_sizing()
    const {frame_width, frame_height} = this.model

    return {
      ...sizing,
      width_policy: frame_width != null && width_policy == "auto" ? "fit" : width_policy,
      height_policy: frame_height != null && height_policy == "auto" ? "fit" : height_policy,
    }
  }

  protected override _intrinsic_display(): FullDisplay {
    return {inner: this.model.flow_mode, outer: "grid"}
  }

  override _update_layout(): void {
    super._update_layout()

    // TODO: invalidating all should imply "needs paint"
    this._invalidate_all = true
    this._needs_paint = true

    const layout = new BorderLayout()

    const {frame_align} = this.model
    layout.aligns = (() => {
      if (isBoolean(frame_align))
        return {left: frame_align, right: frame_align, top: frame_align, bottom: frame_align}
      else {
        const {left=true, right=true, top=true, bottom=true} = frame_align
        return {left, right, top, bottom}
      }
    })()

    layout.set_sizing({width_policy: "max", height_policy: "max"})

    if (this.visuals.outline_line.doit) {
      const width = this.visuals.outline_line.line_width.get_value()
      layout.center_border_width = width
    }

    type Panels = (Axis | Annotation | Annotation[])[]

    const outer_above: Panels = copy(this.model.above)
    const outer_below: Panels = copy(this.model.below)
    const outer_left:  Panels = copy(this.model.left)
    const outer_right: Panels = copy(this.model.right)

    const inner_above: Panels = []
    const inner_below: Panels = []
    const inner_left:  Panels = []
    const inner_right: Panels = []

    const get_side = (side: Side, inner: boolean = false): Panels => {
      switch (side) {
        case "above": return inner ? inner_above : outer_above
        case "below": return inner ? inner_below : outer_below
        case "left":  return inner ? inner_left  : outer_left
        case "right": return inner ? inner_right : outer_right
      }
    }

    const {title_location} = this.model
    if (title_location != null && this._title != null) {
      get_side(title_location).push(this._title)
    }

    if (this._toolbar != null) {
      const {location} = this._toolbar.toolbar

      if (!this.model.toolbar_inner) {
        const panels = get_side(location)
        let push_toolbar = true

        if (this.model.toolbar_sticky) {
          for (let i = 0; i < panels.length; i++) {
            const panel = panels[i]
            if (panel instanceof Title) {
              if (location == "above" || location == "below")
                panels[i] = [panel, this._toolbar]
              else
                panels[i] = [this._toolbar, panel]
              push_toolbar = false
              break
            }
          }
        }

        if (push_toolbar)
          panels.push(this._toolbar)
      } else {
        const panels = get_side(location, true)
        panels.push(this._toolbar)
      }
    }

    const set_layout = (side: Side, model: Annotation | Axis): Layoutable | undefined => {
      const view = this.renderer_view(model)!
      view.panel = new Panel(side)
      view.update_layout?.()
      return view.layout
    }

    const set_layouts = (side: Side, panels: Panels) => {
      const horizontal = side == "above" || side == "below"
      const layouts: Layoutable[] = []

      for (const panel of panels) {
        if (isArray(panel)) {
          const items = panel.map((subpanel) => {
            const item = set_layout(side, subpanel)
            if (item == null)
              return undefined
            if (subpanel instanceof ToolbarPanel) {
              const dim = horizontal ? "width_policy" : "height_policy"
              item.set_sizing({...item.sizing, [dim]: "min"})
            }
            return item
          }).filter((item): item is Layoutable => item != null)

          let layout: Row | Column
          if (horizontal) {
            layout = new Row(items)
            layout.set_sizing({width_policy: "max", height_policy: "min"})
          } else {
            layout = new Column(items)
            layout.set_sizing({width_policy: "min", height_policy: "max"})
          }

          layout.absolute = true
          layouts.push(layout)
        } else {
          const layout = set_layout(side, panel)
          if (layout != null)
            layouts.push(layout)
        }
      }

      return layouts
    }

    const min_border = this.model.min_border ?? 0
    layout.min_border = {
      left:   this.model.min_border_left   ?? min_border,
      top:    this.model.min_border_top    ?? min_border,
      right:  this.model.min_border_right  ?? min_border,
      bottom: this.model.min_border_bottom ?? min_border,
    }

    const center_panel = new NodeLayout()

    const top_panel    = new VStack()
    const bottom_panel = new VStack()
    const left_panel   = new HStack()
    const right_panel  = new HStack()

    const inner_top_panel    = new VStack()
    const inner_bottom_panel = new VStack()
    const inner_left_panel   = new HStack()
    const inner_right_panel  = new HStack()

    center_panel.absolute = true

    top_panel.absolute = true
    bottom_panel.absolute = true
    left_panel.absolute = true
    right_panel.absolute = true

    inner_top_panel.absolute = true
    inner_bottom_panel.absolute = true
    inner_left_panel.absolute = true
    inner_right_panel.absolute = true

    center_panel.children =
      this.model.center.filter((obj): obj is Annotation => {
        return obj instanceof Annotation
      }).map((model) => {
        const view = this.renderer_view(model)!
        view.update_layout?.()
        return view.layout
      }).filter((layout): layout is Layoutable => {
        return layout != null
      })

    const {frame_width, frame_height} = this.model

    center_panel.set_sizing({
      ...(frame_width  != null ? {width_policy:  "fixed", width:  frame_width} : {width_policy:  "fit"}),
      ...(frame_height != null ? {height_policy: "fixed", height: frame_height} : {height_policy: "fit"}),

    })
    center_panel.on_resize((bbox) => this.frame.set_geometry(bbox))

    top_panel.children    = reversed(set_layouts("above", outer_above))
    bottom_panel.children =          set_layouts("below", outer_below)
    left_panel.children   = reversed(set_layouts("left",  outer_left))
    right_panel.children  =          set_layouts("right", outer_right)

    inner_top_panel.children    = set_layouts("above", inner_above)
    inner_bottom_panel.children = set_layouts("below", inner_below)
    inner_left_panel.children   = set_layouts("left",  inner_left)
    inner_right_panel.children  = set_layouts("right", inner_right)

    top_panel.set_sizing({width_policy: "fit", height_policy: "min"/*, min_height: layout.min_border.top*/})
    bottom_panel.set_sizing({width_policy: "fit", height_policy: "min"/*, min_height: layout.min_width.bottom*/})
    left_panel.set_sizing({width_policy: "min", height_policy: "fit"/*, min_width: layout.min_width.left*/})
    right_panel.set_sizing({width_policy: "min", height_policy: "fit"/*, min_width: layout.min_width.right*/})

    inner_top_panel.set_sizing({width_policy: "fit", height_policy: "min"})
    inner_bottom_panel.set_sizing({width_policy: "fit", height_policy: "min"})
    inner_left_panel.set_sizing({width_policy: "min", height_policy: "fit"})
    inner_right_panel.set_sizing({width_policy: "min", height_policy: "fit"})

    layout.center_panel = center_panel

    layout.top_panel = top_panel
    layout.bottom_panel = bottom_panel
    layout.left_panel = left_panel
    layout.right_panel = right_panel

    if (inner_top_panel.children.length != 0)
      layout.inner_top_panel = inner_top_panel
    if (inner_bottom_panel.children.length != 0)
      layout.inner_bottom_panel = inner_bottom_panel
    if (inner_left_panel.children.length != 0)
      layout.inner_left_panel = inner_left_panel
    if (inner_right_panel.children.length != 0)
      layout.inner_right_panel = inner_right_panel

    this.layout = layout
  }

  protected override _measure_layout(): void {
    const {frame_width, frame_height} = this.model

    const frame = {
      width: frame_width == null ? "1fr" : px(frame_width),
      height: frame_height == null ? "1fr" : px(frame_height),
    }

    const {layout} = this

    const top = layout.top_panel.measure({width: Infinity, height: Infinity})
    const bottom = layout.bottom_panel.measure({width: Infinity, height: Infinity})
    const left = layout.left_panel.measure({width: Infinity, height: Infinity})
    const right = layout.right_panel.measure({width: Infinity, height: Infinity})

    const top_height = max(top.height, layout.min_border.top)
    const bottom_height = max(bottom.height, layout.min_border.bottom)
    const left_width = max(left.width, layout.min_border.left)
    const right_width = max(right.width, layout.min_border.right)

    this._computed_style.replace(`
      :host {
        grid-template-rows: ${top_height}px ${frame.height} ${bottom_height}px;
        grid-template-columns: ${left_width}px ${frame.width} ${right_width}px;
      }
    `)
  }

  get axis_views(): AxisView[] {
    const views = []
    for (const [, renderer_view] of this.renderer_views) {
      if (renderer_view instanceof AxisView)
        views.push(renderer_view)
    }
    return views
  }

  update_range(range_info: RangeInfo, options?: RangeOptions): void {
    this.pause()
    this._range_manager.update(range_info, options)
    this.unpause()
  }

  reset_range(): void {
    this.pause()
    this._range_manager.reset()
    this.unpause()
    this.trigger_ranges_update_event()
  }

  trigger_ranges_update_event(): void {
    const {x_range, y_range} = this.model
    const linked_plots = new Set([...x_range.plots, ...y_range.plots])

    for (const plot_view of linked_plots) {
      const {x_range, y_range} = plot_view.model
      plot_view.model.trigger_event(new RangesUpdate(x_range.start, x_range.end, y_range.start, y_range.end))
    }
  }

  get_selection(): Map<DataRenderer, Selection> {
    const selection = new Map<DataRenderer, Selection>()
    for (const renderer of this.model.data_renderers) {
      const {selected} = renderer.selection_manager.source
      selection.set(renderer, selected)
    }
    return selection
  }

  update_selection(selections: Map<DataRenderer, Selection> | null): void {
    for (const renderer of this.model.data_renderers) {
      const ds = renderer.selection_manager.source
      if (selections != null) {
        const selection = selections.get(renderer)
        if (selection != null) {
          ds.selected.update(selection, true)
        }
      } else
        ds.selection_manager.clear()
    }
  }

  reset_selection(): void {
    this.update_selection(null)
  }

  protected _invalidate_layout_if_needed(): void {
    const needs_layout = (() => {
      for (const panel of this.model.side_panels) {
        const view = this.renderer_views.get(panel)! as AnnotationView | AxisView
        if (view.layout?.has_size_changed() ?? false) {
          this.invalidate_painters(view)
          return true
        }
      }
      return false
    })()

    if (needs_layout) {
      this.compute_layout()
    }
  }

  get_renderer_views(): RendererView[] {
    return this.computed_renderers.map((r) => this.renderer_views.get(r)!)
  }

  protected *_compute_renderers(): Generator<Renderer, void, undefined> {
    const {above, below, left, right, center, renderers} = this.model

    yield* renderers
    yield* above
    yield* below
    yield* left
    yield* right
    yield* center

    if (this._title != null)
      yield this._title

    if (this._toolbar != null)
      yield this._toolbar

    for (const [, view] of this.tool_views) {
      yield* view.overlays
    }
  }

  async build_renderer_views(): Promise<void> {
    this.computed_renderers = [...this._compute_renderers()]
    await build_views(this.renderer_views, this.computed_renderers, {parent: this})
  }

  async build_tool_views(): Promise<void> {
    const tool_models = flat_map(this.model.toolbar.tools, (item) => item instanceof ToolProxy ? item.tools : [item])
    const {created} = await build_views(this.tool_views, [...tool_models], {parent: this})
    created.map((tool_view) => this.canvas_view.ui_event_bus.register_tool(tool_view))
  }

  override connect_signals(): void {
    super.connect_signals()

    const {extra_x_ranges, extra_y_ranges, extra_x_scales, extra_y_scales} = this.model.properties
    this.on_change([extra_x_ranges, extra_y_ranges, extra_x_scales, extra_y_scales], () => {
      this.frame.x_range = this.model.x_range
      this.frame.y_range = this.model.y_range
      this.frame.in_x_scale = this.model.x_scale
      this.frame.in_y_scale = this.model.y_scale
      this.frame.extra_x_ranges = this.model.extra_x_ranges
      this.frame.extra_y_ranges = this.model.extra_y_ranges
      this.frame.extra_x_scales = this.model.extra_x_scales
      this.frame.extra_y_scales = this.model.extra_y_scales
      this.frame.configure_scales()
    })

    const {above, below, left, right, center, renderers} = this.model.properties
    const panels = [above, below, left, right, center]
    this.on_change(renderers, async () => {
      await this.build_renderer_views()
    })
    this.on_change(panels, async () => {
      await this.build_renderer_views()
      this.invalidate_layout()
    })

    this.connect(this.model.toolbar.properties.tools.change, async () => {
      await this.build_tool_views()
      await this.build_renderer_views()
    })

    const {x_ranges, y_ranges} = this.frame
    for (const [, range] of x_ranges) {
      this.connect(range.change, () => {
        this.request_paint("everything")
      })
    }
    for (const [, range] of y_ranges) {
      this.connect(range.change, () => {
        this.request_paint("everything")
      })
    }

    this.connect(this.model.change, () => this.request_paint("everything"))
    this.connect(this.model.reset, () => this.reset())

    const {toolbar_location} = this.model.properties
    this.on_change(toolbar_location, async () => {
      const {toolbar_location} = this.model
      if (this._toolbar != null) {
        if (toolbar_location != null) {
          this._toolbar.toolbar.location = toolbar_location
        } else {
          this._toolbar = undefined
          await this.build_renderer_views()
        }
      } else {
        if (toolbar_location != null) {
          const {toolbar, toolbar_inner} = this.model
          this._toolbar = new ToolbarPanel({toolbar})
          toolbar.location = toolbar_location
          toolbar.inner = toolbar_inner
          await this.build_renderer_views()
        }
      }
      this.invalidate_layout()
    })

    const {hold_render} = this.model.properties
    this.on_change(hold_render, () => this._hold_render_changed())
  }

  override has_finished(): boolean {
    if (!super.has_finished())
      return false

    if (this.model.visible) {
      for (const [, renderer_view] of this.renderer_views) {
        if (!renderer_view.has_finished())
          return false
      }
    }

    return true
  }

  override _after_layout(): void {
    super._after_layout()
    this.unpause(true)

    const left = this.layout.left_panel.bbox
    const right = this.layout.right_panel.bbox
    const center = this.layout.center_panel.bbox
    const top = this.layout.top_panel.bbox
    const bottom = this.layout.bottom_panel.bbox
    const {bbox} = this

    const top_height = top.bottom
    const bottom_height = bbox.height - bottom.top
    const left_width = left.right
    const right_width = bbox.width - right.left

    // TODO: don't replace here; inject stylesheet?
    this.canvas.style.replace(`
      .bk-layer.bk-events {
        display: grid;
        grid-template-areas:
          ".    above  .    "
          "left center right"
          ".    below  .    ";
        grid-template-rows: ${px(top_height)} ${px(center.height)} ${px(bottom_height)};
        grid-template-columns: ${px(left_width)} ${px(center.width)} ${px(right_width)};
      }
    `)

    for (const [, child_view] of this.renderer_views) {
      if (child_view instanceof AnnotationView)
        child_view.after_layout?.()
    }

    this.model.setv({
      inner_width: Math.round(this.frame.bbox.width),
      inner_height: Math.round(this.frame.bbox.height),
      outer_width: Math.round(this.bbox.width),
      outer_height: Math.round(this.bbox.height),
    }, {no_change: true})

    if (this.model.match_aspect) {
      this.pause()
      this._range_manager.update_dataranges()
      this.unpause(true)
    }

    if (!this._outer_bbox.equals(this.bbox)) {
      this.canvas_view.resize() // XXX temporary hack
      this._outer_bbox = this.bbox
      this._invalidate_all = true
      this._needs_paint = true
    }

    const {inner_bbox} = this.layout
    if (!this._inner_bbox.equals(inner_bbox)) {
      this._inner_bbox = inner_bbox
      this._invalidate_all = true
      this._needs_paint = true
    }

    if (this._needs_paint) {
      // XXX: can't be this.request_paint(), because it would trigger back-and-forth
      // layout recomputing feedback loop between plots. Plots are also much more
      // responsive this way, especially in interactive mode.
      this.paint()
    }
  }

  repaint(): void {
    this._invalidate_layout_if_needed()
    this.paint()
  }

  paint(): void {
    if (this.is_paused)
      return

    if (this.is_displayed) {
      logger.trace(`${this.toString()}.paint()`)
      this._actual_paint()
    } else {
      // This is possibly the first render cycle, but plot isn't displayed,
      // so all renderers have to be manually marked as finished, because
      // their `render()` method didn't run.
      for (const renderer_view of this.computed_renderer_views) {
        renderer_view.mark_finished()
      }
    }

    if (this._needs_notify) {
      this._needs_notify = false
      this.notify_finished()
    }
  }

  protected _actual_paint(): void {
    const {document} = this.model
    if (document != null) {
      const interactive_duration = document.interactive_duration()
      if (interactive_duration >= 0 && interactive_duration < this.model.lod_interval) {
        setTimeout(() => {
          if (document.interactive_duration() > this.model.lod_timeout) {
            document.interactive_stop()
          }
          this.request_paint("everything") // TODO: this.schedule_paint()
        }, this.model.lod_timeout)
      } else
        document.interactive_stop()
    }

    if (this._range_manager.invalidate_dataranges) {
      this._range_manager.update_dataranges()
      this._invalidate_layout_if_needed()
    }

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
    this._invalidated_painters.clear()
    this._invalidate_all = false

    const frame_box: FrameBox = [
      this.frame.bbox.left,
      this.frame.bbox.top,
      this.frame.bbox.width,
      this.frame.bbox.height,
    ]

    const {primary, overlays} = this.canvas_view

    if (do_primary) {
      primary.prepare()
      this.canvas_view.prepare_webgl(frame_box)

      this._paint_empty(primary.ctx, frame_box)
      this._paint_outline(primary.ctx, frame_box)

      this._paint_levels(primary.ctx, "image", frame_box, true)
      this._paint_levels(primary.ctx, "underlay", frame_box, true)
      this._paint_levels(primary.ctx, "glyph", frame_box, true)
      this._paint_levels(primary.ctx, "guide", frame_box, false)
      this._paint_levels(primary.ctx, "annotation", frame_box, false)
      primary.finish()
    }

    if (do_overlays || settings.wireframe) {
      overlays.prepare()
      this._paint_levels(overlays.ctx, "overlay", frame_box, false)
      if (settings.wireframe)
        this.paint_layout(overlays.ctx, this.layout)
      overlays.finish()
    }

    if (this._initial_state.range == null) {
      this._initial_state.range = this._range_manager.compute_initial() ?? undefined
    }

    this._needs_paint = false
    this.repainted.emit()
  }

  protected _paint_levels(ctx: Context2d, level: RenderLevel, clip_region: FrameBox, global_clip: boolean): void {
    for (const renderer of this.computed_renderers) {
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

      if (renderer_view.has_webgl) {
        this.canvas_view.blit_webgl(ctx)
      }
    }
  }

  paint_layout(ctx: Context2d, layout: Layoutable) {
    const {x, y, width, height} = layout.bbox
    ctx.strokeStyle = "blue"
    ctx.strokeRect(x, y, width, height)
    for (const child of layout) {
      ctx.save()
      if (!layout.absolute)
        ctx.translate(x, y)
      this.paint_layout(ctx, child)
      ctx.restore()
    }
  }

  protected _paint_empty(ctx: Context2d, frame_box: FrameBox): void {
    const [cx, cy, cw, ch] = [0, 0, this.bbox.width, this.bbox.height]
    const [fx, fy, fw, fh] = frame_box

    if (this.visuals.border_fill.doit) {
      ctx.save()
      ctx.beginPath()
      ctx.rect(cx, cy, cw, ch)
      ctx.rect(fx, fy, fw, fh)
      ctx.clip("evenodd")

      ctx.beginPath()
      ctx.rect(cx, cy, cw, ch)
      this.visuals.border_fill.apply(ctx)
      ctx.restore()
    }

    if (this.visuals.background_fill.doit) {
      this.visuals.background_fill.set_value(ctx)
      ctx.fillRect(fx, fy, fw, fh)
    }
  }

  protected _paint_outline(ctx: Context2d, frame_box: FrameBox): void {
    if (this.visuals.outline_line.doit) {
      ctx.save()
      this.visuals.outline_line.set_value(ctx)
      let [x0, y0, w, h] = frame_box
      // XXX: shrink outline region by 1px to make right and bottom lines visible
      // if they are on the edge of the canvas.
      if (x0 + w == this.bbox.width) {
        w -= 1
      }
      if (y0 + h == this.bbox.height) {
        h -= 1
      }
      ctx.strokeRect(x0, y0, w, h)
      ctx.restore()
    }
  }

  override export(type: "auto" | "png" | "svg" = "auto", hidpi: boolean = true): CanvasLayer {
    const output_backend = (() => {
      switch (type) {
        case "auto": return this.canvas_view.model.output_backend
        case "png":  return "canvas"
        case "svg":  return "svg"
      }
    })()

    const composite = new CanvasLayer(output_backend, hidpi)

    const {width, height} = this.bbox
    composite.resize(width, height)

    if (width != 0 && height != 0) {
      const {canvas} = this.canvas_view.compose()
      composite.ctx.drawImage(canvas, 0, 0)
    }

    return composite
  }

  override serializable_state(): SerializableState {
    const {children, ...state} = super.serializable_state()
    const renderers = this.get_renderer_views()
      .filter((view) => view.model.syncable) // filters out computed renderers
      .map((view) => view.serializable_state())
      .filter((item) => item.bbox != null)
    // TODO: remove this when frame is generalized
    const frame = {type: "CartesianFrame", bbox: this.frame.bbox}
    return {...state, children: [...children ?? [], frame, ...renderers]}
  }

  protected _hold_render_changed(): void {
    if (this.model.hold_render) {
      this.pause()
    } else {
      this.unpause()
    }
  }
}
