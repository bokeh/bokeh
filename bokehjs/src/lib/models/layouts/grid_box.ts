import {CSSGridBox, CSSGridBoxView, TracksSizing} from "./css_grid_box"
import {UIElement} from "../ui/ui_element"
import * as p from "core/properties"

export class GridBoxView extends CSSGridBoxView {
  override model: GridBox

  override connect_signals(): void {
    super.connect_signals()
    const {children, rows, cols} = this.model.properties
    this.on_change(children, () => this.update_children())
    this.on_change([rows, cols], () => this.invalidate_layout())
  }

  protected get _children(): [UIElement, number, number, number?, number?][] {
    return this.model.children
  }

  protected get _rows(): TracksSizing | null {
    return this.model.rows
  }

  protected get _cols(): TracksSizing | null {
    return this.model.cols
  }
}

export namespace GridBox {
  export type Attrs = p.AttrsOf<Props>

  export type Props = CSSGridBox.Props & {
    children: p.Property<[UIElement, number, number, number?, number?][]>
    rows: p.Property<TracksSizing | null>
    cols: p.Property<TracksSizing | null>
  }
}

export interface GridBox extends GridBox.Attrs {}

export class GridBox extends CSSGridBox {
  override properties: GridBox.Props
  override __view_type__: GridBoxView

  constructor(attrs?: Partial<GridBox.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = GridBoxView

    this.define<GridBox.Props>(({Int, Tuple, Array, Ref, Opt, Nullable}) => {
      return {
        children: [ Array(Tuple(Ref(UIElement), Int, Int, Opt(Int), Opt(Int))), [] ],
        rows:     [ Nullable(TracksSizing), null ],
        cols:     [ Nullable(TracksSizing), null ],
      }
    })
  }
}
