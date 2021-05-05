import {ActionTool, ActionToolView, ActionToolButtonView} from "./action_tool"
import {CallbackLike0} from "../../callbacks/callback"
import * as p from "core/properties"

export class CustomActionButtonView extends ActionToolButtonView {
  override model: CustomAction

  override css_classes(): string[] {
    return super.css_classes().concat("bk-toolbar-button-custom-action")
  }
}

export class CustomActionView extends ActionToolView {
  override model: CustomAction

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
  override properties: CustomAction.Props
  override __view_type__: CustomActionView

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

  override tool_name = "Custom Action"
  override button_view = CustomActionButtonView
}
