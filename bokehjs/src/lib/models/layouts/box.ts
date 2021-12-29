import {LayoutDOM, LayoutDOMView} from "./layout_dom"
import * as p from "core/properties"
import {unreachable} from "core/util/assert"

export abstract class BoxView extends LayoutDOMView {
  override model: Box
  protected abstract _orientation: "row" | "column"

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.properties.children.change, () => this.rebuild())
  }

  get child_models(): LayoutDOM[] {
    return this.model.children
  }

  override _update_layout(): void {
    const {style} = this.el

    style.display = "flex"
    style.flexDirection = this._orientation
    style.gap = `${this.model.spacing}px`

    for (const view of this.child_views) {
      const sizing = view.box_sizing()
      const flex = (() => {
        const policy = this._orientation == "row" ? sizing.width_policy : sizing.height_policy
        switch (policy) {
          case "fixed": return "0 0 auto"
          case "fit": return "1 1 auto"
          case "min": return "0 1 auto"
          case "max": return "1 0 auto"
          default: unreachable()
        }
      })()
      view.el.style.flex = flex
    }
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
  override properties: Box.Props
  override __view_type__: BoxView

  constructor(attrs?: Partial<Box.Attrs>) {
    super(attrs)
  }

  static {
    this.define<Box.Props>(({Number, Array, Ref}) => ({
      children: [ Array(Ref(LayoutDOM)), [] ],
      spacing:  [ Number, 0 ],
    }))
  }
}
