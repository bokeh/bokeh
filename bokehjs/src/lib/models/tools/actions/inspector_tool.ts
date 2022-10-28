import {ActionTool, ActionToolView} from "./action_tool"
import * as p from "core/properties"
import * as icons from "styles/icons.css"
import {Dialog, DialogView} from "../../ui/dialog"
import {Inspector} from "../../ui/inspector"
import {build_view, IterViews} from "core/build_views"

export class InspectorToolView extends ActionToolView {
  override model: InspectorTool

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

export namespace InspectorTool {
  export type Attrs = p.AttrsOf<Props>
  export type Props = ActionTool.Props
}

export interface InspectorTool extends InspectorTool.Attrs {}

export class InspectorTool extends ActionTool {
  override properties: InspectorTool.Props
  override __view_type__: InspectorToolView

  constructor(attrs?: Partial<InspectorTool.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = InspectorToolView

    this.register_alias("inspector", () => new InspectorTool())
  }

  override tool_name = "Inspector"
  override tool_icon = icons.tool_icon_settings // TODO: better icon
}
