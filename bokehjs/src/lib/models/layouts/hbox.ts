import {CSSGridBox, CSSGridBoxView, TracksSizing} from "./css_grid_box"
import {UIElement} from "../ui/ui_element"
import * as p from "core/properties"

type ChildItem = {child: UIElement, col?: number, span?: number}

export class HBoxView extends CSSGridBoxView {
  declare model: HBox

  override connect_signals(): void {
    super.connect_signals()
    const {children, cols} = this.model.properties
    this.on_change(children, () => this.update_children())
    this.on_change(cols, () => this.invalidate_layout())
  }

  protected get _children(): [UIElement, number, number, number?, number?][] {
    return this.model.children.map(({child, col, span}, i) => [child, 0, col ?? i, 1, span ?? 1])
  }

  protected get _rows(): TracksSizing | null {
    return null
  }

  protected get _cols(): TracksSizing | null {
    return this.model.cols
  }
}

export namespace HBox {
  export type Attrs = p.AttrsOf<Props>

  export type Props = CSSGridBox.Props & {
    children: p.Property<ChildItem[]>
    cols: p.Property<TracksSizing | null>
  }
}

export interface HBox extends HBox.Attrs {}

export class HBox extends CSSGridBox {
  declare properties: HBox.Props
  declare __view_type__: HBoxView

  constructor(attrs?: Partial<HBox.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = HBoxView

    this.define<HBox.Props>(({Int, Struct, Array, Ref, Opt, Nullable}) => ({
      children: [ Array(Struct({child: Ref(UIElement), col: Opt(Int), span: Opt(Int)})), [] ],
      cols: [ Nullable(TracksSizing), null ],
    }))
  }
}
