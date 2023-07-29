import {CartesianFrame, CartesianFrameView} from "../canvas/cartesian_frame"
import type {FrameBox} from "../canvas/canvas"
import {Renderer} from "../renderers/renderer"
import type {RendererView} from "../renderers/renderer"
import {LayoutableRenderer, LayoutableRendererView} from "../renderers/layoutable_renderer"
import {DataRenderer} from "../renderers/data_renderer"
import {Tool} from "../tools/tool"
import {ToolProxy} from "../tools/tool_proxy"
import type {Selection} from "../selections/selection"
import {Annotation, AnnotationView} from "../annotations/annotation"
import {Title} from "../annotations/title"
import {Axis} from "../axes/axis"
import {AxisView} from "../axes/axis"
import type {ToolbarPanelView} from "../annotations/toolbar_panel"
import {ToolbarPanel} from "../annotations/toolbar_panel"

import {Reset} from "core/bokeh_events"
import type {ViewStorage, IterViews} from "core/build_views"
import {build_views, remove_views} from "core/build_views"
import {logger} from "core/logging"
import {RangesUpdate} from "core/bokeh_events"
import type {Side, RenderLevel} from "core/enums"
import type {SerializableState} from "core/view"
import {isBoolean, isNumber, isArray} from "core/util/types"
import {copy, reversed} from "core/util/array"
import {flat_map} from "core/util/iterator"
import type {Context2d} from "core/util/canvas"
import type {Layoutable} from "core/layout"
import {HStack, VStack, NodeLayout} from "core/layout/alignments"
import {BorderLayout} from "core/layout/border"
import {Row, Column} from "core/layout/grid"
import {Panel} from "core/layout/side_panel"
import {BBox} from "core/util/bbox"
import type {RangeInfo, RangeOptions} from "./range_manager"
import {RangeManager} from "./range_manager"
import type {StateInfo} from "./state_manager"
import {StateManager} from "./state_manager"
import {settings} from "core/settings"

import * as mixins from "core/property_mixins"
import type * as visuals from "core/visuals"
import * as p from "core/properties"
import {Signal0} from "core/signaling"
import {Location, ResetPolicy} from "core/enums"
import {isString} from "core/util/types"

import {Grid} from "../grids/grid"
import {Toolbar} from "../tools/toolbar"

import {Boolean, Number, Null, Or} from "../../core/kinds"
import {LRTB} from "../common/kinds"

const FrameAlign = Or(Boolean, LRTB(Boolean))
type FrameAlign = typeof FrameAlign["__type__"]

const MinBorder = Or(Number, LRTB(Number), Null)
type MinBorder = typeof MinBorder["__type__"]

export class PlotRendererView extends LayoutableRendererView {
  declare model: PlotRenderer
  declare visuals: PlotRenderer.Visuals

  declare layout: BorderLayout

  frame_view: CartesianFrameView

  // XXX avoid renaming everywhere for now
  get frame(): CartesianFrameView {
    return this.frame_view
  }

  get layoutables(): LayoutableRenderer[] {
    return [this.model.frame]
  }

  protected _title?: Title
  protected _toolbar?: ToolbarPanel

  get toolbar_panel(): ToolbarPanelView | undefined {
    return this._toolbar != null ? this.renderer_view(this._toolbar) : undefined
  }

  protected _outer_bbox: BBox = new BBox()
  protected _inner_bbox: BBox = new BBox()
  protected _needs_paint: boolean = true

  protected _state_manager: StateManager
  protected _range_manager: RangeManager

  get state(): StateManager {
    return this._state_manager
  }

  set invalidate_dataranges(value: boolean) {
    this._range_manager.invalidate_dataranges = value
  }

  protected lod_started: boolean

  protected _initial_state: StateInfo

  computed_renderers: Renderer[]

  get computed_renderer_views(): RendererView[] {
    return this.computed_renderers.map((r) => this.renderer_views.get(r)!)
  }

  override renderer_view<T extends Renderer>(renderer: T): T["__view_type__"] | undefined {
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

  /*protected*/ readonly renderer_views: ViewStorage<Renderer> = new Map()
  /*protected*/ readonly tool_views: ViewStorage<Tool> = new Map()

  override *children(): IterViews {
    yield* super.children()
    yield* this.renderer_views.values()
    yield* this.tool_views.values()
  }

  private _is_paused?: number
  get is_paused(): boolean {
    return this._is_paused != null && this._is_paused !== 0
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
      this.request_paint()
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
    remove_views(this.renderer_views)
    remove_views(this.tool_views)
    super.remove()
  }

  override initialize(): void {
    this.pause()

    super.initialize()

    this.lod_started = false

    this._initial_state = {
      selection: new Map(), // XXX: initial selection?
    }

    this._state_manager = new StateManager(this, this._initial_state)

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

    //this.frame_view = await build_view(this._frame, {parent: this})
    this.frame_view = this._renderer_views.get(this.model.frame)! as CartesianFrameView
    this._range_manager = new RangeManager(this.frame_view)

    await this.build_tool_views()
    await this.build_renderer_views()
  }

  override _update_layout(): void {
    // TODO: invalidating all should imply "needs paint"
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

    const set_layout = (side: Side, model: Annotation | Axis): Layoutable => {
      const view = this.renderer_view(model)!
      view.panel = new Panel(side)
      view.update_layout?.()
      return view.layout!
    }

    const set_layouts = (side: Side, panels: Panels) => {
      const horizontal = side == "above" || side == "below"
      const layouts: Layoutable[] = []

      for (const panel of panels) {
        if (isArray(panel)) {
          const items = panel.map((subpanel) => {
            const item = set_layout(side, subpanel)
            if (subpanel instanceof ToolbarPanel) {
              const dim = horizontal ? "width_policy" : "height_policy"
              item.set_sizing({...item.sizing, [dim]: "min"})
            }
            return item
          })

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
        } else
          layouts.push(set_layout(side, panel))
      }

      return layouts
    }

    const min_border = this.model.min_border ?? 0
    layout.min_border = {
      left:   this.model.min_border_left ?? (isNumber(min_border) ? min_border : min_border.left ?? 0),
      right:  this.model.min_border_right ?? (isNumber(min_border) ? min_border : min_border.right ?? 0),
      top:    this.model.min_border_top ?? (isNumber(min_border) ? min_border : min_border.top ?? 0),
      bottom: this.model.min_border_bottom ?? (isNumber(min_border) ? min_border : min_border.bottom ?? 0),
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
    center_panel.on_resize((bbox) => {
      this.frame.layout.set_geometry(bbox)
    })

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
    const {x_range, y_range} = this.frame_view
    const linked_plots = new Set([...x_range.frames, ...y_range.frames])

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
      const {above, below, left, right} = this.model
      for (const panel of [...above, ...below, ...left, ...right]) {
        const view = this.renderer_views.get(panel)! as AnnotationView | AxisView
        if (view.layout?.has_size_changed() ?? false) {
          //this.invalidate_painters(view)
          return true
        }
      }
      return false
    })()

    if (needs_layout) {
      //this.compute_layout()
    }
  }

  get_renderer_views(): RendererView[] {
    return this.computed_renderers.map((r) => this.renderer_views.get(r)!)
  }

  protected *_compute_renderers(): Generator<Renderer, void, undefined> {
    const {above, below, left, right, center} = this.model
    const {renderers} = this.model.frame

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

    const {renderers} = this.model.frame.properties
    this.on_change(renderers, async () => {
      await this.build_renderer_views()
    })

    const {above, below, left, right, center} = this.model.properties
    const panels = [above, below, left, right, center]
    this.on_change(panels, async () => {
      await this.build_renderer_views()
      this.canvas_view.request_layout()
    })

    this.connect(this.model.toolbar.properties.tools.change, async () => {
      await this.build_tool_views()
      await this.build_renderer_views()
    })

    const {x_ranges, y_ranges} = this.frame_view
    for (const [, range] of x_ranges) {
      this.connect(range.change, () => { this.request_paint() })
    }
    for (const [, range] of y_ranges) {
      this.connect(range.change, () => { this.request_paint() })
    }

    this.connect(this.model.change, () => this.request_paint())
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
      this.canvas_view.request_layout()
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
    this.unpause(true)

    for (const [, child_view] of this.renderer_views) {
      if (child_view instanceof AnnotationView)
        child_view.after_layout?.()
    }

    this.model.setv({
      inner_width: Math.round(this.frame_view.bbox.width),
      inner_height: Math.round(this.frame_view.bbox.height),
      outer_width: Math.round(this.bbox.width),
      outer_height: Math.round(this.bbox.height),
    }, {no_change: true})

    if (this.model.frame.match_aspect) {
      this.pause()
      this._range_manager.update_dataranges()
      this.unpause(true)
    }

    if (!this._outer_bbox.equals(this.bbox)) {
      this._outer_bbox = this.bbox
      this._needs_paint = true
    }

    const {inner_bbox} = this.layout
    if (!this._inner_bbox.equals(inner_bbox)) {
      this._inner_bbox = inner_bbox
      this._needs_paint = true
    }

    /*
    if (this._needs_paint) {
      // XXX: can't be this.request_paint(), because it would trigger back-and-forth
      // layout recomputing feedback loop between plots. Plots are also much more
      // responsive this way, especially in interactive mode.
      this.paint()
    }
    */
  }

  /*
  repaint(): void {
    this._invalidate_layout_if_needed()
    this.paint()
  }
  */

  protected _render(): void {
    this._paint()
  }

  _paint(): void {
    if (this.is_paused)
      return

    if (this.canvas.is_displayed && this.model.visible) {
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
          this.request_paint() // TODO: this.schedule_paint()
        }, this.model.lod_timeout)
      } else
        document.interactive_stop()
    }

    if (this._range_manager.invalidate_dataranges) {
      this._range_manager.update_dataranges()
      this._invalidate_layout_if_needed()
    }

    const frame_box: FrameBox = [
      this.frame_view.bbox.left,
      this.frame_view.bbox.top,
      this.frame_view.bbox.width,
      this.frame_view.bbox.height,
    ]

    const {primary, overlays} = this.canvas_view
    const {do_primary, do_overlays} = this.canvas_view.painting

    if (do_primary) {
      this.canvas_view.prepare_webgl(frame_box)

      this._paint_empty(primary.ctx, frame_box)
      this._paint_outline(primary.ctx, frame_box)

      this._paint_levels(primary.ctx, "image", frame_box, true)
      this._paint_levels(primary.ctx, "underlay", frame_box, true)
      this._paint_levels(primary.ctx, "glyph", frame_box, true)
      this._paint_levels(primary.ctx, "guide", frame_box, false)
      this._paint_levels(primary.ctx, "annotation", frame_box, false)
    }

    if (do_overlays || settings.wireframe) {
      this._paint_levels(overlays.ctx, "overlay", frame_box, false)
      if (settings.wireframe) {
        this._paint_layout(overlays.ctx, this.layout)
      }
    }

    if (this._initial_state.range == null) {
      this._initial_state.range = this._range_manager.compute_initial() ?? undefined
    }

    this._needs_paint = false
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

  protected _paint_layout(ctx: Context2d, layout: Layoutable) {
    const {x, y, width, height} = layout.bbox
    ctx.strokeStyle = "blue"
    ctx.strokeRect(x, y, width, height)
    for (const child of layout) {
      ctx.save()
      if (!layout.absolute)
        ctx.translate(x, y)
      this._paint_layout(ctx, child)
      ctx.restore()
    }
  }

  protected _paint_empty(ctx: Context2d, frame_bbox: FrameBox): void {
    const {bbox} = this

    const [cx, cy, cw, ch] = [bbox.x, bbox.y, bbox.width, bbox.height]
    const [fx, fy, fw, fh] = frame_bbox

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

  override serializable_state(): SerializableState {
    const {children, ...state} = super.serializable_state()
    const views = [this.frame_view, ...this.get_renderer_views()]
      .filter((view) => view.model.syncable) // filters out computed renderers
      .map((view) => view.serializable_state())
      .filter((item) => item.bbox != null)
    return {...state, children: [...children ?? [], ...views]}
  }

  protected _hold_render_changed(): void {
    if (this.model.hold_render) {
      this.pause()
    } else {
      this.unpause()
    }
  }
}

export namespace PlotRenderer {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Renderer.Props & {
    frame: p.Property<CartesianFrame>

    toolbar: p.Property<Toolbar>
    toolbar_location: p.Property<Location | null>
    toolbar_sticky: p.Property<boolean>
    toolbar_inner: p.Property<boolean>

    frame_width: p.Property<number | null>
    frame_height: p.Property<number | null>
    frame_align: p.Property<FrameAlign>

    title: p.Property<Title | string | null>
    title_location: p.Property<Location | null>

    above: p.Property<(Annotation | Axis)[]>
    below: p.Property<(Annotation | Axis)[]>
    left: p.Property<(Annotation | Axis)[]>
    right: p.Property<(Annotation | Axis)[]>
    center: p.Property<(Annotation | Grid)[]>

    lod_factor: p.Property<number>
    lod_interval: p.Property<number>
    lod_threshold: p.Property<number | null>
    lod_timeout: p.Property<number>

    min_border: p.Property<MinBorder>
    min_border_left: p.Property<number | null>
    min_border_top: p.Property<number | null>
    min_border_right: p.Property<number | null>
    min_border_bottom: p.Property<number | null>

    inner_width: p.Property<number>
    inner_height: p.Property<number>
    outer_width: p.Property<number>
    outer_height: p.Property<number>

    reset_policy: p.Property<ResetPolicy>

    hold_render: p.Property<boolean>
  } & Mixins

  export type Mixins =
    mixins.OutlineLine    &
    mixins.BackgroundFill &
    mixins.BorderFill

  export type Visuals = Renderer.Visuals & {
    outline_line: visuals.Line
    background_fill: visuals.Fill
    border_fill: visuals.Fill
  }
}

export interface PlotRenderer extends PlotRenderer.Attrs {}

export class PlotRenderer extends LayoutableRenderer {
  declare properties: PlotRenderer.Props
  declare __view_type__: PlotRendererView

  readonly use_map: boolean = false

  readonly reset = new Signal0(this, "reset")

  constructor(attrs?: Partial<PlotRenderer.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = PlotRendererView

    this.mixins<PlotRenderer.Mixins>([
      ["outline_",    mixins.Line],
      ["background_", mixins.Fill],
      ["border_",     mixins.Fill],
    ])

    this.define<PlotRenderer.Props>(({Boolean, Number, String, Array, Or, Ref, Null, Nullable}) => ({
      frame:             [ Ref(CartesianFrame) ],

      toolbar:           [ Ref(Toolbar), () => new Toolbar() ],
      toolbar_location:  [ Nullable(Location), "right" ],
      toolbar_sticky:    [ Boolean, true ],
      toolbar_inner:     [ Boolean, false ],

      frame_width:       [ Nullable(Number), null ],
      frame_height:      [ Nullable(Number), null ],
      frame_align:       [ FrameAlign, true ],

      // revise this when https://github.com/microsoft/TypeScript/pull/42425 is merged
      title:             [ Or(Ref(Title), String, Null), "", {
        convert: (title) => isString(title) ? new Title({text: title}) : title,
      }],
      title_location:    [ Nullable(Location), "above" ],

      above:             [ Array(Or(Ref(Annotation), Ref(Axis))), [] ],
      below:             [ Array(Or(Ref(Annotation), Ref(Axis))), [] ],
      left:              [ Array(Or(Ref(Annotation), Ref(Axis))), [] ],
      right:             [ Array(Or(Ref(Annotation), Ref(Axis))), [] ],
      center:            [ Array(Or(Ref(Annotation), Ref(Grid))), [] ],

      lod_factor:        [ Number, 10 ],
      lod_interval:      [ Number, 300 ],
      lod_threshold:     [ Nullable(Number), 2000 ],
      lod_timeout:       [ Number, 500 ],

      min_border:        [ MinBorder, 5 ],
      min_border_left:   [ Nullable(Number), null ],
      min_border_right:  [ Nullable(Number), null ],
      min_border_top:    [ Nullable(Number), null ],
      min_border_bottom: [ Nullable(Number), null ],

      inner_width:       [ Number, p.unset, {readonly: true} ],
      inner_height:      [ Number, p.unset, {readonly: true} ],
      outer_width:       [ Number, p.unset, {readonly: true} ],
      outer_height:      [ Number, p.unset, {readonly: true} ],

      reset_policy:      [ ResetPolicy, "standard" ],

      hold_render:       [ Boolean, false ],
    }))

    this.override<PlotRenderer.Props>({
      //width: 600,
      //height: 600,
      outline_line_color: "#e5e5e5",
      border_fill_color: "#ffffff",
      background_fill_color: "#ffffff",
    })
  }

  get data_renderers(): DataRenderer[] {
    return this.frame.renderers.filter((r): r is DataRenderer => r instanceof DataRenderer)
  }
}
