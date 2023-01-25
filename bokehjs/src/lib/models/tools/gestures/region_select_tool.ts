import {SelectTool, SelectToolView} from "./select_tool"
import {BoxAnnotation} from "../../annotations/box_annotation"
import {PolyAnnotation} from "../../annotations/poly_annotation"
import {DataRendererView} from "../../renderers/data_renderer"
import {SelectionMode} from "core/enums"
import {Geometry} from "core/geometry"
import {KeyModifiers} from "core/ui_events"
import * as p from "core/properties"

export abstract class RegionSelectToolView extends SelectToolView {
  declare model: RegionSelectTool

  override get overlays() {
    return [...super.overlays, this.model.overlay]
  }

  protected _is_continuous(ev: KeyModifiers): boolean {
    return this.model.continuous != ev.alt_key
  }

  _select(geometry: Geometry, final: boolean, mode: SelectionMode): void {
    const renderers_by_source = this._computed_renderers_by_data_source()

    for (const [, renderers] of renderers_by_source) {
      const sm = renderers[0].get_selection_manager()

      const r_views: DataRendererView[] = []
      for (const r of renderers) {
        const r_view = this.plot_view.renderer_view(r)
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
    continuous: p.Property<boolean>
    persistent: p.Property<boolean>
  }
}

export interface RegionSelectTool extends RegionSelectTool.Attrs {}

export abstract class RegionSelectTool extends SelectTool {
  declare properties: RegionSelectTool.Props
  declare __view_type__: RegionSelectToolView

  declare overlay: BoxAnnotation | PolyAnnotation

  constructor(attrs?: Partial<RegionSelectTool.Attrs>) {
    super(attrs)
  }

  static {
    this.define<RegionSelectTool.Props>(({Boolean}) => ({
      continuous: [ Boolean, false ],
      persistent: [ Boolean, false ],
    }))
  }
}
