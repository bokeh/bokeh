import {ActionTool, ActionToolView} from "./action_tool"
import {CustomJS} from "models/callbacks/customjs"
import type {CallbackLike0} from "core/util/callbacks"
import {execute} from "core/util/callbacks"
import {isBoolean} from "core/util/types"
import type * as p from "core/properties"
import * as icons from "styles/icons.css"
import {logger} from "core/logging"

export class CustomActionView extends ActionToolView {
  declare model: CustomAction

  protected async _update_active(): Promise<void> {
    const {active_callback} = this.model
    if (active_callback == "auto") {
      this.model.active = !this.model.active
    } else if (active_callback != null) {
      const active = await execute(active_callback, this.model)
      if (isBoolean(active)) {
        this.model.active = active
      } else {
        logger.warn(`${this.model}.active_callback (${active_callback}) must return a boolean value, got ${typeof active}`)
      }
    }
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()

    const {active_callback} = this.model
    if (!(active_callback == "auto" || active_callback == null)) {
      await this._update_active()
    }
  }

  async _execute(): Promise<void> {
    const {callback, active_callback} = this.model
    if (callback != null) {
      const result = await execute(callback, this.model)
      if (active_callback != null) {
        await this._update_active()
      } else if (isBoolean(result)) {
        this.model.active = result
      } else if (result !== undefined) {
        logger.warn(`${this.model}.callback (${callback}) must return a boolean value or void, got ${typeof result}`)
      }
    }
  }

  doit(): void {
    this._await_ready(this._execute())
  }
}

export namespace CustomAction {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ActionTool.Props & {
    callback: p.Property<CustomJS | CallbackLike0<CustomAction, unknown> | null>
    active_callback: p.Property<CustomJS | CallbackLike0<CustomAction, unknown> | "auto" | null>
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

    this.define<CustomAction.Props>(({Func, Nullable, Ref, Or, Auto}) => ({
      callback: [ Nullable(Or(Ref(CustomJS), Func())), null ],
      active_callback: [ Nullable(Or(Ref(CustomJS), Func(), Auto)), null ],
    }))

    this.override<CustomAction.Props>({
      description: "Perform a Custom Action",
    })

    // `active` and `disabled` are defined in `Tool` model as internal properties
    this.override_options<CustomAction.Props>({
      active: {internal: false},
      disabled: {internal: false},
    })
  }

  override tool_name = "Custom Action"
  override tool_icon = icons.tool_icon_unknown
}
