import {LayoutDOM, LayoutDOMView} from "./layout_dom"
import {Grid} from "core/layout"
import * as p from "core/properties"

export abstract class BoxView extends LayoutDOMView {
  model: Box
  layout: Grid

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.properties.children.change, () => this.rebuild())
  }

  get child_models(): LayoutDOM[] {
    return this.model.children
  }
}

export namespace Box {
  export type Attrs = p.AttrsOf<Props>

  export type Props = LayoutDOM.Props & {
    children: p.Property<LayoutDOM[]>
    spacing: p.Property<number>
  }
}

export interface Box extends Box.Attrs {}

export abstract class Box extends LayoutDOM {
  properties: Box.Props
  __view_type__: BoxView

  constructor(attrs?: Partial<Box.Attrs>) {
    super(attrs)
  }

  static init_Box(): void {
    this.define<Box.Props>(({Number, Array, Ref}) => ({
      children: [ Array(Ref(LayoutDOM)), [] ],
      spacing:  [ Number, 0 ],
    }))
  }
}
