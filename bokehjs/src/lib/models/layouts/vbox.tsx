import {CSSGridBox, CSSGridBoxView} from "./css_grid_box"
import {TracksSizing, Index, Span} from "../common/kinds"
import {UIElement} from "../ui/ui_element"
import {Struct, Ref, Opt} from "core/kinds"
import type * as p from "core/properties"

type VBoxChild = {child: UIElement, row?: number, span?: number} // XXX: can't infere ?
const VBoxChild = Struct<VBoxChild>({child: Ref(UIElement), row: Opt(Index), span: Opt(Span)})

export class VBoxView extends CSSGridBoxView {
  declare model: VBox

  override connect_signals(): void {
    super.connect_signals()
    const {children, rows} = this.model.properties
    this.on_change(children, () => this.update_children())
    this.on_change(rows, () => this.invalidate_layout())
  }

  protected get _children(): [UIElement, number, number, number?, number?][] {
    return this.model.children.map(({child, row, span}, i) => [child, row ?? i, 0, span ?? 1, 1])
  }

  protected get _rows(): TracksSizing | null {
    return this.model.rows
  }

  protected get _cols(): TracksSizing | null {
    return null
  }
}

export namespace VBox {
  export type Attrs = p.AttrsOf<Props>

  export type Props = CSSGridBox.Props & {
    children: p.Property<VBoxChild[]>
    rows: p.Property<TracksSizing | null>
  }
}

export interface VBox extends VBox.Attrs {}

export class VBox extends CSSGridBox {
  declare properties: VBox.Props
  declare __view_type__: VBoxView

  constructor(attrs?: Partial<VBox.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = VBoxView

    this.define<VBox.Props>(({List, Nullable}) => ({
      children: [ List(VBoxChild), [] ],
      rows: [ Nullable(TracksSizing), null ],
    }))
  }
}
