import {Class} from "core/class"
import {DOMView} from "core/dom_view"
import {Tool, ToolView} from "./tool"
import {empty} from "core/dom"
import * as p from "core/properties"
import {startsWith} from "core/util/string"
import {isString} from "core/util/types"
import {bk_toolbar_button} from "styles/toolbar"

export abstract class ButtonToolButtonView extends DOMView {
  model: ButtonTool

  initialize(): void {
    super.initialize()
    this.connect(this.model.change, () => this.render())
    this.el.addEventListener("click", () => this._clicked())
    this.render() // XXX: this isn't governed by layout, for now
  }

  css_classes(): string[] {
    return super.css_classes().concat(bk_toolbar_button)
  }

  render(): void {
    empty(this.el)
    const icon = this.model.computed_icon
    if (isString(icon)) {
      if (startsWith(icon, "data:image"))
        this.el.style.backgroundImage = "url('" + icon + "')"
      else
        this.el.classList.add(icon)
    }
    this.el.title = this.model.tooltip
  }

  protected abstract _clicked(): void
}

export abstract class ButtonToolView extends ToolView {
  model: ButtonTool
}

export namespace ButtonTool {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Tool.Props & {
    disabled: p.Property<boolean>
  }
}

export interface ButtonTool extends ButtonTool.Attrs {}

export abstract class ButtonTool extends Tool {
  properties: ButtonTool.Props

  constructor(attrs?: Partial<ButtonTool.Attrs>) {
    super(attrs)
  }

  static init_ButtonTool(): void {
    this.internal({
      disabled:    [ p.Boolean,    false ],
    })
  }

  tool_name: string

  icon: string

  button_view: Class<ButtonToolButtonView>

  get tooltip(): string {
    return this.tool_name
  }

  get computed_icon(): string {
    return this.icon
  }
}
