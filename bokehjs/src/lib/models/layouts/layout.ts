import {UIElement, UIElementView} from "../ui/ui_element"
import {Align, SizingMode} from "core/enums"
import {SizingPolicy} from "core/layout"
import * as p from "core/properties"

export abstract class LayoutView extends UIElementView {
  override model: Layout
}

export type Margin = number | [number, number] | [number, number, number, number]

export namespace Layout {
  export type Attrs = p.AttrsOf<Props>

  export type Props = UIElement.Props & {
    width: p.Property<number | null>
    height: p.Property<number | null>
    min_width: p.Property<number | null>
    min_height: p.Property<number | null>
    max_width: p.Property<number | null>
    max_height: p.Property<number | null>
    margin: p.Property<Margin>
    aspect_ratio: p.Property<number | "auto" | null>
    width_policy: p.Property<SizingPolicy | "auto">
    height_policy: p.Property<SizingPolicy | "auto">
    sizing_mode: p.Property<SizingMode | null>
    align: p.Property<Align | [Align, Align]>
  }
}

export interface Layout extends Layout.Attrs {}

export abstract class Layout extends UIElement {
  override properties: Layout.Props
  override __view_type__: LayoutDOMView

  constructor(attrs?: Partial<Layout.Attrs>) {
    super(attrs)
  }

  static {
    this.define<Layout.Props>(({Int, Number, Auto, Tuple, Or, Nullable, NonNegative}) => {
      const Margin = Or(Int, Tuple(Int, Int), Tuple(Int, Int, Int, Int))
      return {
        width:         [ Nullable(NonNegative(Int)), null ],
        height:        [ Nullable(NonNegative(Int)), null ],
        min_width:     [ Nullable(NonNegative(Int)), null ],
        min_height:    [ Nullable(NonNegative(Int)), null ],
        max_width:     [ Nullable(NonNegative(Int)), null ],
        max_height:    [ Nullable(NonNegative(Int)), null ],
        margin:        [ Margin, [0, 0, 0, 0] ],
        aspect_ratio:  [ Nullable(Or(NonNegative(Number), Auto)), null ],
        width_policy:  [ Or(SizingPolicy, Auto), "auto" ],
        height_policy: [ Or(SizingPolicy, Auto), "auto" ],
        sizing_mode:   [ Nullable(SizingMode), null ],
        align:         [ Or(Align, Tuple(Align, Align)), "start" ],
      }
    })
  }
}
