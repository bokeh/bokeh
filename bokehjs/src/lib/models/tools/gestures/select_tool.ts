import {GestureTool, GestureToolView} from "./gesture_tool"
import {GlyphRenderer} from "../../renderers/glyph_renderer"
import {GraphRenderer} from "../../renderers/graph_renderer"
import {DataRenderer} from "../../renderers/data_renderer"
import type {DataSource} from "../../sources/data_source"
import {compute_renderers} from "../../util"
import type * as p from "core/properties"
import type {KeyEvent, KeyModifiers} from "core/ui_events"
import {SelectionMode} from "core/enums"
import {SelectionGeometry} from "core/bokeh_events"
import type {Geometry} from "core/geometry"
import {Signal0} from "core/signaling"
import type {MenuItem} from "core/util/menus"
import {unreachable} from "core/util/assert"
import {uniq} from "core/util/array"

export abstract class SelectToolView extends GestureToolView {
  declare model: SelectTool

  override connect_signals(): void {
    super.connect_signals()
    this.model.invert.connect(() => this._invert_selection())
    this.model.clear.connect(() => this._clear_selection())
  }

  get computed_renderers(): DataRenderer[] {
    const {renderers} = this.model
    const all_renderers = this.plot_view.model.data_renderers
    return compute_renderers(renderers, all_renderers)
  }

  _computed_renderers_by_data_source(): Map<DataSource, DataRenderer[]> {
    const renderers_by_source: Map<DataSource, DataRenderer[]> = new Map()

    for (const r of this.computed_renderers) {
      let source: DataSource
      if (r instanceof GlyphRenderer)
        source = r.data_source
      else if (r instanceof GraphRenderer)
        source = r.node_renderer.data_source
      else
        continue

      const renderers = renderers_by_source.get(source) ?? []
      renderers_by_source.set(source, [...renderers, r])
    }

    return renderers_by_source
  }

  protected _clear_overlay(): void {}

  protected _clear_other_overlays(): void {
    for (const view of this.plot_view.tool_views.values()) {
      if (view instanceof SelectToolView && view != this) {
        view._clear_overlay()
      }
    }
  }

  protected _clear_selection(): void {
    const {computed_renderers} = this
    const selection_managers = uniq(computed_renderers.map((r) => r.selection_manager))
    for (const selection_manager of selection_managers) {
      selection_manager.clear()
    }
    this.plot_view.request_paint(computed_renderers)
  }

  protected _invert_selection(): void {
    const {computed_renderers} = this
    const selection_managers = uniq(computed_renderers.map((r) => r.selection_manager))
    for (const selection_manager of selection_managers) {
      selection_manager.invert()
    }
    this.plot_view.request_paint(computed_renderers)
  }

  protected _select_mode(modifiers: KeyModifiers): SelectionMode {
    const {shift, ctrl} = modifiers

    if (!shift && !ctrl)
      return this.model.mode
    else if (shift && !ctrl)
      return "append"
    else if (!shift && ctrl)
      return "intersect"
    else if (shift && ctrl)
      return "subtract"
    else
      unreachable()
  }

  override _keyup(ev: KeyEvent): void {
    if (!this.model.active)
      return

    if (ev.key == "Escape") {
      this._clear_selection()
    }
  }

  protected abstract _select(geometry: Geometry, final: boolean, mode: SelectionMode): void

  protected _emit_selection_event(geometry: Geometry, final: boolean = true): void {
    const {x_scale, y_scale} = this.plot_view.frame

    const geometry_data = (() => {
      switch (geometry.type) {
        case "point": {
          const {sx, sy} = geometry
          const x = x_scale.invert(sx)
          const y = y_scale.invert(sy)
          return {...geometry, x, y}
        }
        case "span": {
          const {sx, sy} = geometry
          const x = x_scale.invert(sx)
          const y = y_scale.invert(sy)
          return {...geometry, x, y}
        }
        case "rect": {
          const {sx0, sx1, sy0, sy1} = geometry
          const [x0, x1] = x_scale.r_invert(sx0, sx1)
          const [y0, y1] = y_scale.r_invert(sy0, sy1)
          return {...geometry, x0, y0, x1, y1}
        }
        case "poly": {
          const {sx, sy} = geometry
          const x = x_scale.v_invert(sx)
          const y = y_scale.v_invert(sy)
          return {...geometry, x, y}
        }
      }
    })()

    this.plot_view.model.trigger_event(new SelectionGeometry(geometry_data, final))
  }
}

export namespace SelectTool {
  export type Attrs = p.AttrsOf<Props>

  export type Props = GestureTool.Props & {
    renderers: p.Property<DataRenderer[] | "auto">
    mode: p.Property<SelectionMode>
  }
}

export interface SelectTool extends SelectTool.Attrs {}

export abstract class SelectTool extends GestureTool {
  declare properties: SelectTool.Props
  declare __view_type__: SelectToolView

  readonly invert = new Signal0(this, "invert")
  readonly clear = new Signal0(this, "clear")

  constructor(attrs?: Partial<SelectTool.Attrs>) {
    super(attrs)
  }

  static {
    this.define<SelectTool.Props>(({Array, Ref, Or, Auto}) => ({
      renderers: [ Or(Array(Ref(DataRenderer)), Auto), "auto" ],
      mode:      [ SelectionMode, "replace" ],
    }))
  }

  override get menu(): MenuItem[] | null {
    return [
      {
        icon: "bk-tool-icon-replace-mode",
        tooltip: "Replace the current selection",
        active: () => this.mode == "replace",
        handler: () => {
          this.mode = "replace"
          this.active = true
        },
      }, {
        icon: "bk-tool-icon-append-mode",
        tooltip: "Append to the current selection (Shift)",
        active: () => this.mode == "append",
        handler: () => {
          this.mode = "append"
          this.active = true
        },
      }, {
        icon: "bk-tool-icon-intersect-mode",
        tooltip: "Intersect with the current selection (Ctrl)",
        active: () => this.mode == "intersect",
        handler: () => {
          this.mode = "intersect"
          this.active = true
        },
      }, {
        icon: "bk-tool-icon-subtract-mode",
        tooltip: "Subtract from the current selection (Shift+Ctrl)",
        active: () => this.mode == "subtract",
        handler: () => {
          this.mode = "subtract"
          this.active = true
        },
      }, {
        icon: "bk-tool-icon-xor-mode",
        tooltip: "Symmetric difference with the current selection",
        active: () => this.mode == "xor",
        handler: () => {
          this.mode = "xor"
          this.active = true
        },
      },
      null,
      {
        icon: "bk-tool-icon-invert-selection",
        tooltip: "Invert the current selection",
        handler: () => {
          this.invert.emit()
        },
      }, {
        icon: "bk-tool-icon-clear-selection",
        tooltip: "Clear the current selection and/or selection overlay (Esc)",
        handler: () => {
          this.clear.emit()
        },
      },
    ]
  }
}
