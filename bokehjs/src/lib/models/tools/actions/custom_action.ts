import {ActionTool, ActionToolView, ActionToolButtonView} from "./action_tool"
import {CallbackLike0} from "../../callbacks/callback"
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
    this.model.callback?.execute(this.model)
  }
}

export namespace CustomAction {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ActionTool.Props & {
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
      callback: [ Nullable(Any /*TODO*/) ],
      icon:     [ String ],
    }))

    this.override<CustomAction.Props>({
      description: "Perform a Custom Action",
    })
  }

  tool_name = "Custom Action"
  button_view = CustomActionButtonView
}
