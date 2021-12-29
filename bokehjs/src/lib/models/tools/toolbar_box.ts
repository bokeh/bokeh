import * as p from "core/properties"
import {Location} from "core/enums"
import {Toolbar, ToolbarView} from "./toolbar"

import {LayoutDOM, LayoutDOMView} from "../layouts/layout_dom"

export class ToolbarBoxView extends LayoutDOMView {
  override model: ToolbarBox

  override initialize(): void {
    this.model.toolbar.toolbar_location = this.model.toolbar_location
    super.initialize()
  }

  get toolbar_view(): ToolbarView {
    return this.child_views[0] as any
  }

  override connect_signals(): void {
    super.connect_signals()
    const {parent} = this
    if (parent instanceof LayoutDOMView) {
      parent.mouseenter.connect(() => {
        this.toolbar_view.set_visibility(true)
      })
      parent.mouseleave.connect(() => {
        this.toolbar_view.set_visibility(false)
      })
    }

    const {toolbar_location} = this.model.properties
    this.on_change(toolbar_location, () => {
      this.model.toolbar.toolbar_location = this.model.toolbar_location
    })
  }

  get child_models(): LayoutDOM[] {
    return [this.model.toolbar as any] // XXX
  }

  override after_layout(): void {
    super.after_layout()
    //this.toolbar_view.layout.bbox = this.layout.bbox
    this.toolbar_view.render() // render the second time to revise overflow
  }
}

export namespace ToolbarBox {
  export type Attrs = p.AttrsOf<Props>

  export type Props = LayoutDOM.Props & {
    toolbar: p.Property<Toolbar>
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
      toolbar:          [ Ref(Toolbar) ],
      toolbar_location: [ Location, "right" ],
    }))
  }
}
