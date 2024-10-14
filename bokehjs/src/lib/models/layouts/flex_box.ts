import type {FullDisplay} from "./layout_dom"
import {LayoutDOM, LayoutDOMView} from "./layout_dom"
import {GridAlignmentLayout} from "./alignments"
import {Container} from "core/layout/grid"
import {UIElement} from "../ui/ui_element"
import {px} from "core/dom"
import type * as p from "core/properties"

type Direction = "row" | "column"

export abstract class FlexBoxView extends LayoutDOMView {
  declare model: FlexBox
  protected abstract _direction: Direction

  override connect_signals(): void {
    super.connect_signals()
    const {children} = this.model.properties
    this.on_change(children, () => this.update_children())
  }

  get child_models(): UIElement[] {
    return this.model.children
  }

  protected override _intrinsic_display(): FullDisplay {
    return {inner: this.model.flow_mode, outer: "flex"}
  }

  override _update_layout(): void {
    super._update_layout()

    this.style.append(":host", {
      flex_direction: this._direction,
      gap: px(this.model.spacing),
    })

    const layoutable = new Container<LayoutDOMView>()
    let r0 = 0
    let c0 = 0

    for (const view of this.child_views) {
      if (!(view instanceof LayoutDOMView)) {
        continue
      }

      const sizing = view.box_sizing()
      const flex = (() => {
        const policy = this._direction == "row" ? sizing.width_policy : sizing.height_policy
        const size = this._direction == "row" ? sizing.width : sizing.height
        const basis = size != null ? px(size) : "auto"
        switch (policy) {
          case "auto":
          case "fixed": return `0 0 ${basis}`
          case "fit": return "1 1 auto"
          case "min": return "0 1 auto"
          case "max": return "1 0 0px"
        }
      })()

      const align_self = (() => {
        const policy = this._direction == "row" ? sizing.height_policy : sizing.width_policy
        switch (policy) {
          case "auto":
          case "fixed":
          case "fit":
          case "min": return this._direction == "row" ? sizing.valign : sizing.halign
          case "max": return "stretch"
        }
      })()

      view.style.append(":host", {flex, align_self})

      // undo `width/height: 100%` and let `align-self: stretch` do the work
      if (this._direction == "row") {
        if (sizing.height_policy == "max") {
          view.style.append(":host", {height: "auto"})
        }
      } else {
        if (sizing.width_policy == "max") {
          view.style.append(":host", {width: "auto"})
        }
      }

      if (view.layout != null) {
        layoutable.add({r0, c0, r1: r0 + 1, c1: c0 + 1}, view)

        if (this._direction == "row") {
          c0 += 1
        } else {
          r0 += 1
        }
      }
    }

    if (layoutable.size != 0) {
      this.layout = new GridAlignmentLayout(layoutable)
      this.layout.set_sizing()
    } else {
      delete this.layout
    }
  }
}

export namespace FlexBox {
  export type Attrs = p.AttrsOf<Props>

  export type Props = LayoutDOM.Props & {
    children: p.Property<UIElement[]>
    spacing: p.Property<number>
  }
}

export interface FlexBox extends FlexBox.Attrs {}

export abstract class FlexBox extends LayoutDOM {
  declare properties: FlexBox.Props
  declare __view_type__: FlexBoxView

  constructor(attrs?: Partial<FlexBox.Attrs>) {
    super(attrs)
  }

  static {
    this.define<FlexBox.Props>(({Float, List, Ref}) => ({
      children: [ List(Ref(UIElement)), [] ],
      spacing:  [ Float, 0 ],
    }))
  }
}
