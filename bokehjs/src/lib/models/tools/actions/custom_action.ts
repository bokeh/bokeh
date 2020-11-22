import {ActionTool, ActionToolView, ActionToolButtonView} from "./action_tool"
import {CallbackLike0} from "../../callbacks/callback"
import * as p from "core/properties"
import {bk_toolbar_button_custom_action} from "styles/toolbar"

export class CustomActionButtonView extends ActionToolButtonView {
  model: CustomAction

  css_classes(): string[] {
    return super.css_classes().concat(bk_toolbar_button_custom_action)
  }
}

export class CustomActionView extends ActionToolView {
  model: CustomAction

  doit(): void {
    this.model.callback?.execute(this.model)
  }
}

export namespace CustomAction {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ActionTool.Props & {
    action_tooltip: p.Property<string>
    callback: p.Property<CallbackLike0<CustomAction> | null>
    icon: p.Property<string>
  }
}

export interface CustomAction extends CustomAction.Attrs {}

export class CustomAction extends ActionTool {
  properties: CustomAction.Props
  __view_type__: CustomActionView

  constructor(attrs?: Partial<CustomAction.Attrs>) {
    super(attrs)
  }

  static init_CustomAction(): void {
    this.prototype.default_view = CustomActionView

    this.define<CustomAction.Props>(({Any, String, Nullable}) => ({
      /** @deprecated */
      action_tooltip: [ String, "Perform a Custom Action" ],
      callback:       [ Nullable(Any /*TODO*/) ],
      icon:           [ String ],
    }))
  }

  tool_name = "Custom Action"

  button_view = CustomActionButtonView

  get tooltip(): string {
    return this.description ?? this.action_tooltip
  }
}
