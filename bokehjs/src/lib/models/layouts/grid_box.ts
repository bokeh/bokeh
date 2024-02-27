import {CSSGridBox, CSSGridBoxView} from "./css_grid_box"
import {TracksSizing, GridChild} from "../common/kinds"
import {UIElement} from "../ui/ui_element"
import type * as p from "core/properties"

export class GridBoxView extends CSSGridBoxView {
  declare model: GridBox

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
  declare properties: GridBox.Props
  declare __view_type__: GridBoxView

  constructor(attrs?: Partial<GridBox.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = GridBoxView

    this.define<GridBox.Props>(({List, Nullable}) => {
      return {
        children: [ List(GridChild(UIElement)), [] ],
        rows:     [ Nullable(TracksSizing), null ],
        cols:     [ Nullable(TracksSizing), null ],
      }
    })
  }
}
