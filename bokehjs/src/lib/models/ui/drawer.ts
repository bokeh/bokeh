import {Pane, PaneView} from "../ui/pane"
import type {View} from "core/view"
import type {StyleSheetLike} from "core/dom"
import {div, InlineStyleSheet} from "core/dom"
import {Location} from "core/enums"
import type {PanEvent} from "core/ui_gestures"
import {UIGestures} from "core/ui_gestures"
import type * as p from "core/properties"
import {assert} from "core/util/assert"
import * as drawers_css from "styles/drawers.css"
import * as icons_css from "styles/icons.css"

const {max} = Math

export class DrawerView extends PaneView {
  declare model: Drawer

  constructor(options: View.Options) {
    super(options)
    this.on_pan_start = this.on_pan_start.bind(this)
    this.on_pan = this.on_pan.bind(this)
    this.on_pan_end = this.on_pan_end.bind(this)
  }

  protected readonly sizing = new InlineStyleSheet()

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), icons_css.default, drawers_css.default, this.sizing]
  }

  protected readonly handle_el = div({class: drawers_css.handle})
  protected readonly contents_el = div({class: drawers_css.contents})
  protected toggle_el: HTMLElement

  protected ui_gestures = new UIGestures(this.handle_el, this)

  override connect_signals(): void {
    super.connect_signals()
    this.ui_gestures.connect_signals()

    const {location, open, resizable} = this.model.properties
    this.on_change(open, () => {
      this.toggle(this.model.open)
    })
    this.on_change(location, () => {
      this.class_list.remove(drawers_css.left, drawers_css.right, drawers_css.above, drawers_css.below)
      this.class_list.add(drawers_css[this.model.location])
    })
    this.on_change(resizable, () => {
      this.class_list.toggle(drawers_css.resizable, this.model.resizable)
    })
  }

  override get self_target(): HTMLElement | ShadowRoot {
    return this.contents_el
  }

  protected title(open: boolean): string {
    return open ? "Collapse" : "Expand"
  }

  override render(): void {
    super.render()
    const {location, open, resizable} = this.model

    this.class_list.add(drawers_css[location])
    this.class_list.toggle(drawers_css.open, open)
    this.class_list.toggle(drawers_css.resizable, resizable)

    const icon_el = div({class: drawers_css.chevron})

    const title = this.title(open)
    this.toggle_el = div({class: drawers_css.toggle, title}, icon_el)
    this.toggle_el.addEventListener("click", () => this.toggle())

    this.shadow_el.append(this.contents_el, this.toggle_el, this.handle_el)
  }

  toggle(open?: boolean): void {
    open = this.class_list.toggle(drawers_css.open, open)
    this.toggle_el.title = this.title(open)
    this.model.open = open
  }

  protected state: {width: number, height: number} | null = null

  on_pan_start(_event: PanEvent): void {
    assert(this.state == null)

    const styles = getComputedStyle(this.el)
    this.state = {
      width: parseFloat(styles.width),
      height: parseFloat(styles.height),
    }
    this.class_list.add(drawers_css.resizing)
  }

  on_pan(event: PanEvent): void {
    assert(this.state != null)

    const size = (() => {
      const {width, height} = this.state
      const {dx, dy} = event
      switch (this.model.location) {
        case "left":  return max(width  + dx, 0)
        case "right": return max(width  - dx, 0)
        case "above": return max(height + dy, 0)
        case "below": return max(height - dy, 0)
      }
    })()

    this.sizing.replace(`
      :host {
        --drawer-size: ${size}px;
      }
    `)
  }

  on_pan_end(_event: PanEvent): void {
    assert(this.state != null)
    this.state = null
    this.class_list.remove(drawers_css.resizing)
  }
}

export namespace Drawer {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Pane.Props & {
    location: p.Property<Location>
    open: p.Property<boolean>
    resizable: p.Property<boolean>
  }
}

export interface Drawer extends Drawer.Attrs {}

export class Drawer extends Pane {
  declare properties: Drawer.Props
  declare __view_type__: DrawerView

  constructor(attrs?: Partial<Drawer.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = DrawerView

    this.define<Drawer.Props>(({Bool}) => ({
      location: [ Location ],
      open: [ Bool, false ],
      resizable: [ Bool, false ],
    }))
  }
}
