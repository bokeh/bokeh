import {ActionTool, ActionToolView, ActionToolButtonView} from "./action_tool"
import {CallbackLike} from "../../callbacks/callback"
import * as p from "core/properties"

export class CustomActionButtonView extends ActionToolButtonView {
  model: CustomAction

  css_classes(): string[] {
    return super.css_classes().concat("bk-toolbar-button-custom-action")
  }
}

export class CustomActionView extends ActionToolView {
  model: CustomAction

  doit(): void {
    if (this.model.callback != null)
      this.model.callback.execute(this.model)
  }
}

export namespace CustomAction {
  export interface Attrs extends ActionTool.Attrs {
    action_tooltip: string
    callback: CallbackLike<CustomAction> | null
    icon: string
  }

  export interface Props extends ActionTool.Props {}
}

export interface CustomAction extends CustomAction.Attrs {}

export class CustomAction extends ActionTool {

  properties: CustomAction.Props

  constructor(attrs?: Partial<CustomAction.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "CustomAction"
    this.prototype.default_view = CustomActionView

    this.define({
      action_tooltip: [ p.String, 'Perform a Custom Action'],
      callback:       [ p.Any                              ], // TODO: p.Either(p.Instance(Callback), p.Function) ]
      icon:           [ p.String,                          ],
    })
  }

  tool_name = "Custom Action"

  button_view = CustomActionButtonView

  get tooltip(): string {
    return this.action_tooltip
  }
}

CustomAction.initClass()
