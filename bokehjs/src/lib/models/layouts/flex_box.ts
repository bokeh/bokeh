import {LayoutDOM, LayoutDOMView} from "./layout_dom"
import {StyleSheet, StyleSheetLike, px} from "core/dom"
import * as p from "core/properties"
import {unreachable} from "core/util/assert"

export abstract class FlexBoxView extends LayoutDOMView {
  override model: FlexBox
  protected abstract _direction: "row" | "column"

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.properties.children.change, () => this.rebuild())
  }

  get child_models(): LayoutDOM[] {
    return this.model.children
  }

  private readonly _flex = new StyleSheet()

  override styles(): StyleSheetLike[] {
    return [...super.styles(), this._flex]
  }

  override _update_layout(): void {
    super._update_layout()

    this._flex.replace(`
      :host {
        display: flex;
        flex-direction: ${this._direction};
        gap: ${px(this.model.spacing)};
      }
    `)

    for (const view of this.child_views) {
      const sizing = view.box_sizing()
      const flex = (() => {
        const policy = this._direction == "row" ? sizing.width_policy : sizing.height_policy
        switch (policy) {
          case "fixed": return "0 0 auto"
          case "fit": return "1 1 auto"
          case "min": return "0 1 auto"
          case "max": return "1 0 auto"
          default: unreachable()
        }
      })()
      view.el.style.flex = flex

      const align = (() => {
        const policy = this._direction == "row" ? sizing.height_policy : sizing.width_policy
        switch (policy) {
          case "fixed":
          case "fit":
          case "min": return (this._direction == "row" ? sizing.valign : sizing.halign) ?? "unset"
          case "max": return "stretch"
          default: unreachable()
        }
      })()
      view.el.style.alignSelf = align
    }
  }
}

export namespace FlexBox {
  export type Attrs = p.AttrsOf<Props>

  export type Props = LayoutDOM.Props & {
    children: p.Property<LayoutDOM[]>
    spacing: p.Property<number>
  }
}

export interface FlexBox extends FlexBox.Attrs {}

export abstract class FlexBox extends LayoutDOM {
  override properties: FlexBox.Props
  override __view_type__: FlexBoxView

  constructor(attrs?: Partial<FlexBox.Attrs>) {
    super(attrs)
  }

  static {
    this.define<FlexBox.Props>(({Number, Array, Ref}) => ({
      children: [ Array(Ref(LayoutDOM)), [] ],
      spacing:  [ Number, 0 ],
    }))
  }
}
