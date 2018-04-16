import {Class} from "core/class"
import {DOMView} from "core/dom_view"
import {Tool, ToolView} from "./tool"
import {empty} from "core/dom"
import * as p from "core/properties"

export abstract class ButtonToolButtonView extends DOMView {
  model: ButtonTool

  initialize(options: any): void {
    super.initialize(options)
    this.connect(this.model.change, () => this.render())
    this.el.addEventListener("click", () => this._clicked())
    this.render()
  }

  css_classes(): string[] {
    return super.css_classes().concat("bk-toolbar-button")
  }

  render(): void {
    empty(this.el)
    this.el.classList.add(this.model.icon)
    this.el.title = this.model.tooltip
  }

  protected abstract _clicked(): void
}

export abstract class ButtonToolView extends ToolView {
  model: ButtonTool
}

export namespace ButtonTool {
  export interface Attrs extends Tool.Attrs {
    disabled: boolean
  }

  export interface Props extends Tool.Props {}
}

export interface ButtonTool extends ButtonTool.Attrs {}

export abstract class ButtonTool extends Tool {

  properties: ButtonTool.Props

  constructor(attrs?: Partial<ButtonTool.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "ButtonTool"

    this.internal({
      disabled: [ p.Boolean, false ],
    })
  }

  tool_name: string

  icon: string

  button_view: Class<ButtonToolButtonView>

  get tooltip(): string {
    return this.tool_name
  }
}

ButtonTool.initClass()
