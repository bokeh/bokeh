import {Pane, PaneView} from "../ui/pane"
import {Coordinate} from "../coordinates/coordinate"
import {Node} from "../coordinates/node"
import {Anchor} from "../common/kinds"
import * as resolve from "../common/resolve"
import type {StyleSheetLike} from "core/dom"
import {px} from "core/dom"
import type * as p from "core/properties"

import panels_css, * as _panel from "styles/panels.css"

export class PanelView extends PaneView {
  declare model: Panel

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), panels_css]
  }

  override connect_signals(): void {
    super.connect_signals()
    const {position, anchor, width, height, elements} = this.model.properties
    this.on_change([anchor, width, height, elements], () => this.reposition())
    this.on_transitive_change(position, () => this.reposition())
  }

  override reposition(displayed?: boolean): void {
    super.reposition(displayed)

    const {position, visible, anchor, elements} = this.model
    if (displayed == false || !visible || elements.length == 0) {
      this.el.remove()
      return
    }

    const {x: left, y: top} = this.resolve_as_xy(position)
    if (!isFinite(left + top)) {
      this.el.remove()
      return
    }

    const parent_el = this.parent?.el ?? document.body
    const target_el = parent_el.shadowRoot ?? parent_el

    if (!this.el.isConnected) {
      target_el.append(this.el)
    }

    this.el.style.left = px(left)
    this.el.style.top = px(top)

    const xy = resolve.anchor(anchor)
    this.el.style.transform = `translate(${-100*xy.x}%, ${-100*xy.y}%)`
  }
}

export namespace Panel {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Pane.Props & {
    position: p.Property<Coordinate>
    anchor: p.Property<Anchor>
    width: p.Property<"auto" | number | Node>
    height: p.Property<"auto" | number | Node>
  }
}

export interface Panel extends Panel.Attrs {}

export class Panel extends Pane {
  declare properties: Panel.Props
  declare __view_type__: PanelView

  constructor(attrs?: Partial<Panel.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = PanelView

    this.define<Panel.Props>(({Ref, Or, Auto, Int}) => ({
      position: [ Ref(Coordinate) ],
      anchor: [ Anchor, "top_left" ],
      width: [ Or(Auto, Int, Ref(Node)), "auto" ],
      height: [ Or(Auto, Int, Ref(Node)), "auto" ],
    }))
  }
}
