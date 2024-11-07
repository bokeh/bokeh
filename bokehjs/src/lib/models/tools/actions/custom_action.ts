import {ActionTool, ActionToolView} from "./action_tool"
import type {CallbackLike0} from "core/util/callbacks"
import {execute} from "core/util/callbacks"
import {isBoolean} from "core/util/types"
import type * as p from "core/properties"
import * as icons from "styles/icons.css"

export class CustomActionView extends ActionToolView {
  declare model: CustomAction

  async _execute(): Promise<void> {
    const {callback} = this.model
    if (callback != null) {
      const active = await execute(callback, this.model)
      if (isBoolean(active)) {
        this.model.active = active
      }
    }
  }

  doit(): void {
    void this._execute()
  }
}

export namespace CustomAction {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ActionTool.Props & {
    callback: p.Property<CallbackLike0<CustomAction> | null>
  }
}

export interface CustomAction extends CustomAction.Attrs {}

export class CustomAction extends ActionTool {
  declare properties: CustomAction.Props
  declare __view_type__: CustomActionView

  constructor(attrs?: Partial<CustomAction.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = CustomActionView

    this.define<CustomAction.Props>(({Any, Nullable}) => ({
      callback: [ Nullable(Any /*TODO*/), null ],
    }))

    this.override<CustomAction.Props>({
      description: "Perform a Custom Action",
    })
  }

  override tool_name = "Custom Action"
  override tool_icon = icons.tool_icon_unknown
}
