import {ActionTool, ActionToolView} from "./action_tool"
import * as p from "core/properties"
import * as icons from "styles/icons.css"
import {Dialog, DialogView} from "../../ui/dialog"
import {Inspector} from "../../ui/inspector"
import {build_view, IterViews} from "core/build_views"

export class SettingsToolView extends ActionToolView {
  override model: SettingsTool

  protected _dialog: DialogView

  override *children(): IterViews {
    yield* super.children()
    yield this._dialog
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()

    const dialog = new Dialog({
      content: new Inspector({target: this.parent.model}),
      closable: true,
      visible: false,
    })
    this._dialog = await build_view(dialog, {parent: this.parent})
  }

  doit(): void {
    this._dialog.model.visible = true
  }
}

export namespace SettingsTool {
  export type Attrs = p.AttrsOf<Props>
  export type Props = ActionTool.Props
}

export interface SettingsTool extends SettingsTool.Attrs {}

export class SettingsTool extends ActionTool {
  override properties: SettingsTool.Props
  override __view_type__: SettingsToolView

  constructor(attrs?: Partial<SettingsTool.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = SettingsToolView

    this.register_alias("settings", () => new SettingsTool())
  }

  override tool_name = "Settings"
  override tool_icon = icons.tool_icon_settings
}
