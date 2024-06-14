import {SelectTool, SelectToolView} from "./select_tool"
import type {BoxAnnotation} from "../../annotations/box_annotation"
import type {PolyAnnotation} from "../../annotations/poly_annotation"
import type {DataRendererView} from "../../renderers/data_renderer"
import {RegionSelectionMode} from "core/enums"
import type {SelectionMode} from "core/enums"
import type {Geometry} from "core/geometry"
import type {KeyModifiers} from "core/ui_events"
import type * as p from "core/properties"

export abstract class RegionSelectToolView extends SelectToolView {
  declare model: RegionSelectTool

  override get overlays() {
    return [...super.overlays, this.model.overlay]
  }

  protected _is_continuous(modifiers: KeyModifiers): boolean {
    return this.model.continuous != modifiers.alt
  }

  _select(geometry: Geometry, final: boolean, mode: SelectionMode): void {
    const renderers_by_source = this._computed_renderers_by_data_source()

    for (const [, renderers] of renderers_by_source) {
      const sm = renderers[0].get_selection_manager()

      const r_views: DataRendererView[] = []
      for (const r of renderers) {
        const r_view = this.plot_view.views.find_one(r)
        if (r_view != null) {
          r_views.push(r_view)
        }
      }
      sm.select(r_views, geometry, final, mode)
    }

    this._emit_selection_event(geometry, final)
  }

  protected override _clear_overlay(): void {
    super._clear_overlay()
    this.model.overlay.clear()
  }
}

export namespace RegionSelectTool {
  export type Attrs = p.AttrsOf<Props>

  export type Props = SelectTool.Props & {
    mode: p.Property<RegionSelectionMode>
    continuous: p.Property<boolean>
    persistent: p.Property<boolean>
    greedy: p.Property<boolean>
  }
}

export interface RegionSelectTool extends RegionSelectTool.Attrs {}

export abstract class RegionSelectTool extends SelectTool {
  declare properties: RegionSelectTool.Props
  declare __view_type__: RegionSelectToolView

  declare overlay: BoxAnnotation | PolyAnnotation
  declare mode: RegionSelectionMode

  constructor(attrs?: Partial<RegionSelectTool.Attrs>) {
    super(attrs)
  }

  static {
    this.define<RegionSelectTool.Props>(({Bool}) => ({
      mode:       [ RegionSelectionMode, "replace" ],
      continuous: [ Bool, false ],
      persistent: [ Bool, false ],
      greedy:     [ Bool, false ],
    }))
  }
}
