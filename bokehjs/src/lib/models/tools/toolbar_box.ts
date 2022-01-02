import * as p from "core/properties"
import {Location} from "core/enums"
import {ToolbarBase, ToolbarBaseView} from "./toolbar_base"

import {LayoutDOM, LayoutDOMView} from "../layouts/layout_dom"
import {ContentBox} from "core/layout"

export class ToolbarBoxView extends LayoutDOMView {
  override model: ToolbarBox

  override initialize(): void {
    this.model.toolbar.toolbar_location = this.model.toolbar_location
    super.initialize()
  }

  get _toolbar_view(): ToolbarBaseView {
    return this.child_views[0] as any
  }

  override connect_signals(): void {
    super.connect_signals()
    const {parent} = this
    if (parent instanceof LayoutDOMView) {
      parent.mouseenter.connect(() => {
        this._toolbar_view.set_visibility(true)
      })
      parent.mouseleave.connect(() => {
        this._toolbar_view.set_visibility(false)
      })
    }
  }

  get child_models(): LayoutDOM[] {
    return [this.model.toolbar as any] // XXX
  }

  override _update_layout(): void {
    this.layout = new ContentBox(this.child_views[0].el)

    const {toolbar} = this.model

    if (toolbar.horizontal) {
      this.layout.set_sizing({
        width_policy: "fit", min_width: 100, height_policy: "fixed",
      })
    } else {
      this.layout.set_sizing({
        width_policy: "fixed", height_policy: "fit", min_height: 100,
      })
    }
  }

  override after_layout(): void {
    super.after_layout()
    this._toolbar_view.layout.bbox = this.layout.bbox
    this._toolbar_view.render() // render the second time to revise overflow
  }
}

export namespace ToolbarBox {
  export type Attrs = p.AttrsOf<Props>

  export type Props = LayoutDOM.Props & {
    toolbar: p.Property<ToolbarBase>
    toolbar_location: p.Property<Location>
  }
}

export interface ToolbarBox extends ToolbarBox.Attrs {}

export class ToolbarBox extends LayoutDOM {
  override properties: ToolbarBox.Props
  override __view_type__: ToolbarBoxView

  constructor(attrs?: Partial<ToolbarBox.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = ToolbarBoxView

    this.define<ToolbarBox.Props>(({Ref}) => ({
      toolbar:          [ Ref(ToolbarBase) ],
      toolbar_location: [ Location, "right" ],
    }))
  }
}
