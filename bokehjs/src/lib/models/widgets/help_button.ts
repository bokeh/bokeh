import {AbstractButton, AbstractButtonView} from "./abstract_button"
import type {TooltipView} from "../ui/tooltip"
import {Tooltip} from "../ui/tooltip"
import {BuiltinIcon} from "../ui/icons/builtin_icon"
import type {IterViews} from "core/build_views"
import {build_view} from "core/build_views"
import type * as p from "core/properties"

export class HelpButtonView extends AbstractButtonView {
  declare model: HelpButton

  protected tooltip: TooltipView

  override *children(): IterViews {
    yield* super.children()
    yield this.tooltip
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    const {tooltip} = this.model
    this.tooltip = await build_view(tooltip, {parent: this})
  }

  override remove(): void {
    this.tooltip.remove()
    super.remove()
  }

  override render(): void {
    super.render()

    let persistent = false

    const toggle = (visible: boolean) => {
      this.tooltip.model.setv({
        visible,
        closable: persistent,
      })
      //icon_el.style.visibility = visible && persistent ? "visible" : ""
    }

    this.on_change(this.tooltip.model.properties.visible, () => {
      const {visible} = this.tooltip.model
      if (!visible) {
        persistent = false
      }
      toggle(visible)
    })
    this.el.addEventListener("mouseenter", () => {
      toggle(true)
    })
    this.el.addEventListener("mouseleave", () => {
      if (!persistent) {
        toggle(false)
      }
    })
    document.addEventListener("mousedown", (event) => {
      const path = event.composedPath()
      if (path.includes(this.tooltip.el)) {
        return
      } else if (path.includes(this.el)) {
        persistent = !persistent
        toggle(persistent)
      } else {
        persistent = false
        toggle(false)
      }
    })
    window.addEventListener("blur", () => {
      persistent = false
      toggle(false)
    })
  }
}

export namespace HelpButton {
  export type Attrs = p.AttrsOf<Props>

  export type Props = AbstractButton.Props & {
    tooltip: p.Property<Tooltip>
  }
}

export interface HelpButton extends HelpButton.Attrs {}

export class HelpButton extends AbstractButton {
  declare properties: HelpButton.Props
  declare __view_type__: HelpButtonView

  constructor(attrs?: Partial<HelpButton.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = HelpButtonView

    this.define<HelpButton.Props>(({Ref}) => ({
      tooltip: [ Ref(Tooltip) ],
    }))

    this.override<HelpButton.Props>({
      label: "",
      icon: () => new BuiltinIcon({icon_name: "help", size: 18}),
      button_type: "default",
    })
  }
}
